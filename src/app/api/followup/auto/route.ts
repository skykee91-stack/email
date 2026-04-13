// 팔로업 자동 실행 API
// POST /api/followup/auto → 2차, 3차, 4차 팔로업을 한번에 자동 실행
// 각 단계별 조건:
//   2차: 1차 발송 후 3일 경과 + 답장 없음
//   3차: 1차 발송 후 7일 경과 + 2차 발송 완료 + 답장 없음
//   4차: 1차 발송 후 14일 경과 + 3차 발송 완료 + 답장 없음

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'

// 팔로업 스케줄 설정
const FOLLOWUP_SCHEDULE = [
  { step: 2, delayDays: 3, prevStep: 1 },
  { step: 3, delayDays: 7, prevStep: 2 },
  { step: 4, delayDays: 14, prevStep: 3 },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun || false

    // 모든 활성 템플릿 + 발신자 프로필 가져오기
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { step: 'asc' },
    })
    const profiles = await prisma.senderProfile.findMany()

    // 카테고리+단계별 템플릿 매핑 (예: "피원코팅즈" + 2차 → 피원코팅즈 2차 템플릿)
    const templateMap: Record<string, Record<number, string>> = {}
    for (const t of templates) {
      const cat = t.category || 'default'
      if (!templateMap[cat]) templateMap[cat] = {}
      if (!templateMap[cat][t.step]) templateMap[cat][t.step] = t.id
    }

    // 카테고리별 발신자 프로필 매핑
    const profileMap: Record<string, string> = {}
    for (const p of profiles) {
      // 프로필 서비스명으로 매핑 (예: "피원코팅즈코리아" → "피원코팅즈")
      for (const cat of Object.keys(templateMap)) {
        if (p.serviceName.includes(cat) || cat.includes(p.serviceName)) {
          profileMap[cat] = p.id
        }
      }
      if (p.isDefault) profileMap['default'] = p.id
    }

    const allResults: Array<{
      step: number
      category: string
      candidates: number
      sent: number
      skipped: number
      templateName?: string
      targets?: Array<{ name: string; email: string; businessCategory: string }>
    }> = []

    for (const schedule of FOLLOWUP_SCHEDULE) {
      const { step, delayDays, prevStep } = schedule

      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - delayDays)

      // 브랜드별로 후보 조회 (같은 브랜드 2차가 안 나간 업체만)
      const allBrands = Object.keys(templateMap)
      const groups: Record<string, Array<{ businessId: string; business: { id: string; name: string; email: string | null; category: string | null }; template: { category: string | null; name: string } | null }>> = {}

      for (const brand of allBrands) {
        if (!templateMap[brand]?.[prevStep]) continue
        const candidates = await prisma.emailSend.findMany({
          where: {
            step: prevStep,
            status: { in: ['sent', 'delivered'] },
            sentAt: { lte: targetDate },
            repliedAt: null,
            template: { category: brand },
            business: {
              status: 'active',
              emailSends: {
                none: {
                  step,
                  template: { category: brand },
                },
              },
            },
          },
          include: {
            business: { select: { id: true, name: true, email: true, category: true } },
            template: { select: { category: true, name: true } },
          },
          take: 200,
        })
        if (candidates.length > 0) {
          groups[brand] = candidates
        }
      }

      for (const [cat, groupCandidates] of Object.entries(groups)) {
        const templateId = templateMap[cat]?.[step]
        const profileId = profileMap[cat] || profileMap['default']
        const templateName = templates.find(t => t.id === templateId)?.name || '없음'

        if (dryRun) {
          allResults.push({
            step,
            category: cat,
            candidates: groupCandidates.length,
            sent: 0,
            skipped: 0,
            templateName,
            targets: groupCandidates.map(c => ({
              name: c.business.name,
              email: c.business.email || '',
              businessCategory: c.business.category || '',
            })),
          })
          continue
        }

        if (!templateId) {
          allResults.push({ step, category: cat, candidates: groupCandidates.length, sent: 0, skipped: groupCandidates.length, templateName: '템플릿 없음' })
          continue
        }

        let sent = 0
        let skipped = 0

        for (const candidate of groupCandidates) {
          const result = await sendEmail({
            businessId: candidate.businessId,
            templateId,
            step,
            profileId,
          })
          if (result.success) sent++
          else skipped++
        }

        allResults.push({ step, category: cat, candidates: groupCandidates.length, sent, skipped, templateName })
      }
    }

    const totalSent = allResults.reduce((s, r) => s + r.sent, 0)
    const totalCandidates = allResults.reduce((s, r) => s + r.candidates, 0)

    return NextResponse.json({
      dryRun,
      summary: {
        totalCandidates,
        totalSent,
        message: dryRun
          ? `팔로업 대상 ${totalCandidates}명 (드라이런)`
          : `팔로업 ${totalSent}건 발송 완료`,
      },
      steps: allResults,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '팔로업 자동 실행 실패', detail: String(error) },
      { status: 500 }
    )
  }
}

// GET: 팔로업 현황 요약 (카테고리별)
export async function GET() {
  try {
    const results = []

    for (const schedule of FOLLOWUP_SCHEDULE) {
      const { step, delayDays, prevStep } = schedule
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - delayDays)

      // 브랜드별로 대상 후보 조회
      const templates = await prisma.emailTemplate.findMany({
        where: { isActive: true, category: { not: null } },
        select: { category: true },
      })
      const brands = Array.from(new Set(templates.map(t => t.category!))).filter(Boolean)

      const byCategory: Record<string, { count: number; businessCategories: Record<string, number> }> = {}
      let totalCandidates = 0

      for (const brand of brands) {
        const candidates = await prisma.emailSend.findMany({
          where: {
            step: prevStep,
            status: { in: ['sent', 'delivered'] },
            sentAt: { lte: targetDate },
            repliedAt: null,
            template: { category: brand },
            business: {
              status: 'active',
              emailSends: {
                none: {
                  step,
                  template: { category: brand },
                },
              },
            },
          },
          include: {
            business: { select: { category: true } },
          },
        })

        if (candidates.length > 0) {
          byCategory[brand] = { count: candidates.length, businessCategories: {} }
          totalCandidates += candidates.length
          for (const c of candidates) {
            const bizCat = c.business.category || '미분류'
            byCategory[brand].businessCategories[bizCat] = (byCategory[brand].businessCategories[bizCat] || 0) + 1
          }
        }
      }

      const alreadySent = await prisma.emailSend.count({ where: { step } })

      results.push({
        step,
        label: `${step}차 팔로업`,
        delayDays,
        pendingCount: totalCandidates,
        sentCount: alreadySent,
        description: `1차 발송 ${delayDays}일 후 자동 발송`,
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          count: data.count,
          businessCategories: Object.entries(data.businessCategories)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        })),
      })
    }

    const firstSent = await prisma.emailSend.count({ where: { step: 1 } })
    const totalReplied = await prisma.emailSend.count({ where: { repliedAt: { not: null } } })

    return NextResponse.json({
      firstSent,
      totalReplied,
      steps: results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
