// 팔로업 자동 발송 실행기
// - 2~4차 단계별로 브랜드별 후보를 조회해서 매칭된 템플릿/발신자로 순차 발송
// - 발송 간 딜레이 적용 (기본 5초, 일반 발송과 동일)

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/sender'
import type { SendJob } from '@/lib/email/send-queue'

const FOLLOWUP_SCHEDULE = [
  { step: 2, delayDays: 3, prevStep: 1 },
  { step: 3, delayDays: 7, prevStep: 2 },
  { step: 4, delayDays: 14, prevStep: 3 },
]

export interface FollowupStepResult {
  step: number
  category: string
  candidates: number
  sent: number
  skipped: number
  templateName?: string
}

export interface FollowupOverview {
  totalCandidates: number
  steps: Array<{
    step: number
    brands: Array<{
      category: string
      candidates: number
      templateName: string
    }>
  }>
}

/**
 * 팔로업 후보를 스캔만 해서 총 대상 수와 브랜드별 분포를 반환한다.
 * (runner의 totalTargets 세팅에 사용)
 * tenantId: null (어드민) 이면 전체, 값이 있으면 해당 테넌트만
 */
export async function scanFollowupCandidates(tenantId?: string | null): Promise<FollowupOverview> {
  const tenantFilter: { tenantId?: string } = tenantId ? { tenantId } : {}
  const templates = await prisma.emailTemplate.findMany({
    where: { ...tenantFilter, isActive: true },
    orderBy: { step: 'asc' },
  })

  const templateMap: Record<string, Record<number, { id: string; name: string }>> = {}
  for (const t of templates) {
    const cat = t.category || 'default'
    if (!templateMap[cat]) templateMap[cat] = {}
    if (!templateMap[cat][t.step]) templateMap[cat][t.step] = { id: t.id, name: t.name }
  }

  const overview: FollowupOverview = { totalCandidates: 0, steps: [] }

  for (const schedule of FOLLOWUP_SCHEDULE) {
    const { step, delayDays, prevStep } = schedule
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - delayDays)

    const brands = Object.keys(templateMap).filter(
      (b) => templateMap[b]?.[prevStep] && templateMap[b]?.[step],
    )

    const brandResults: FollowupOverview['steps'][number]['brands'] = []
    for (const brand of brands) {
      const count = await prisma.emailSend.count({
        where: {
          ...tenantFilter,
          step: prevStep,
          status: { in: ['sent', 'delivered'] },
          sentAt: { lte: targetDate },
          repliedAt: null,
          template: { category: brand },
          business: {
            status: 'active',
            emailSends: {
              none: {
                ...tenantFilter,
                step,
                template: { category: brand },
              },
            },
          },
        },
      })
      if (count > 0) {
        brandResults.push({
          category: brand,
          candidates: count,
          templateName: templateMap[brand][step].name,
        })
        overview.totalCandidates += count
      }
    }
    if (brandResults.length > 0) {
      overview.steps.push({ step, brands: brandResults })
    }
  }

  return overview
}

/**
 * 팔로업 자동 발송을 실제로 수행한다.
 * - update 콜백으로 진행 상황을 실시간 반영 (sent/skipped/metadata)
 * - delayMs 간격으로 발송
 * - tenantId: null (어드민) 이면 전체, 값이 있으면 해당 테넌트 팔로업만
 */
export async function runFollowupAuto(
  update: (partial: Partial<SendJob>) => void,
  delayMs: number,
  tenantId?: string | null,
): Promise<{ sent: number; skipped: number }> {
  const tenantFilter: { tenantId?: string } = tenantId ? { tenantId } : {}
  // 1) 템플릿/프로필 로드 (tenant-scoped)
  const templates = await prisma.emailTemplate.findMany({
    where: { ...tenantFilter, isActive: true },
    orderBy: { step: 'asc' },
  })
  const profiles = await prisma.senderProfile.findMany({ where: tenantFilter })

  const templateMap: Record<string, Record<number, string>> = {}
  const templateNameMap: Record<string, string> = {}
  for (const t of templates) {
    const cat = t.category || 'default'
    if (!templateMap[cat]) templateMap[cat] = {}
    if (!templateMap[cat][t.step]) templateMap[cat][t.step] = t.id
    templateNameMap[t.id] = t.name
  }

  const profileMap: Record<string, string> = {}
  for (const p of profiles) {
    for (const cat of Object.keys(templateMap)) {
      if (p.serviceName.includes(cat) || cat.includes(p.serviceName)) {
        profileMap[cat] = p.id
      }
    }
    if (p.isDefault) profileMap['default'] = p.id
  }

  const stepResults: FollowupStepResult[] = []
  let totalSent = 0
  let totalSkipped = 0

  // 2) 단계별 순회
  for (const schedule of FOLLOWUP_SCHEDULE) {
    const { step, delayDays, prevStep } = schedule
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - delayDays)

    const allBrands = Object.keys(templateMap)

    for (const brand of allBrands) {
      if (!templateMap[brand]?.[prevStep] || !templateMap[brand]?.[step]) continue

      const templateId = templateMap[brand][step]
      const profileId = profileMap[brand] || profileMap['default']
      const templateName = templateNameMap[templateId] || '없음'

      let stepSent = 0
      let stepSkipped = 0
      let brandCandidatesTotal = 0
      // 이미 시도한 emailSend.id 를 추적 — 수신거부/무효 이메일처럼 EmailSend 레코드를
      // 만들지 않고 스킵되는 경우에도 다음 배치에서 다시 선택되지 않도록 차단 (무한 루프 방지)
      const attemptedIds = new Set<string>()
      const BATCH_SIZE = 500

      // 같은 브랜드×단계 조합의 모든 후보를 배치 단위로 순회 (take 500 제한 제거)
      while (true) {
        const attemptedArr = Array.from(attemptedIds)
        const candidates = await prisma.emailSend.findMany({
          where: {
            ...tenantFilter,
            step: prevStep,
            status: { in: ['sent', 'delivered'] },
            sentAt: { lte: targetDate },
            repliedAt: null,
            template: { category: brand },
            business: {
              status: 'active',
              emailSends: {
                none: {
                  ...tenantFilter,
                  step,
                  template: { category: brand },
                },
              },
            },
            ...(attemptedArr.length > 0 ? { id: { notIn: attemptedArr } } : {}),
          },
          include: {
            business: {
              select: { id: true, name: true, email: true, category: true },
            },
          },
          take: BATCH_SIZE,
        })

        if (candidates.length === 0) break

        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i]
          attemptedIds.add(c.id)
          brandCandidatesTotal++
          try {
            const result = await sendEmail({
              businessId: c.businessId,
              templateId,
              step,
              profileId,
              tenantId: c.tenantId ?? undefined,
              campaignId: c.campaignId ?? undefined,
            })
            if (result.success) {
              stepSent++
              totalSent++
            } else {
              stepSkipped++
              totalSkipped++
            }
          } catch (e) {
            stepSkipped++
            totalSkipped++
            console.error('[followup] sendEmail 오류:', e)
          }

          // 진행상황 실시간 반영
          update({
            sent: totalSent,
            skipped: totalSkipped,
            metadata: {
              currentStep: step,
              currentBrand: brand,
              stepSent,
              stepSkipped,
            },
          })

          // 딜레이 (마지막 여부 판별 복잡해서 일관 적용 — 총 시간 영향 미미)
          if (delayMs > 0) {
            await new Promise((r) => setTimeout(r, delayMs))
          }
        }
      }

      if (brandCandidatesTotal > 0) {
        stepResults.push({
          step,
          category: brand,
          candidates: brandCandidatesTotal,
          sent: stepSent,
          skipped: stepSkipped,
          templateName,
        })
        update({ metadata: { stepResults } })
      }
    }
  }

  update({ metadata: { stepResults, done: true } })
  return { sent: totalSent, skipped: totalSkipped }
}
