// 이메일 발송 엔진
// 발송 전 모든 체크(수신거부, 반송, 야간, 중복 등)를 거침

import { prisma } from '@/lib/prisma'
import { brevo } from '@/lib/brevo'
import { renderTemplate } from '@/lib/email/template'
import { verifyEmail } from '@/lib/email/verify'

// 브랜드별 타겟 업종 키워드 (pending API와 동일)
const BRAND_TARGET_KEYWORDS: Record<string, string[]> = {
  '셀포': [],
  '피원코팅즈': [
    '자동차', '카', '차량', '랩핑', '바이크', '자전거', '오토바이',
    '판금', '도장', '튜닝', '디테일', 'PPF', '광택', '폴리싱', '세차', '모터스',
    '타이어', '정비', '카센터', '공업사',
  ],
}

function isTargetCategory(brand: string | null, category: string | null): boolean {
  if (!brand) return true
  const keywords = BRAND_TARGET_KEYWORDS[brand]
  if (!keywords || keywords.length === 0) return true
  if (!category) return false
  return keywords.some(k => category.toLowerCase().includes(k.toLowerCase()))
}

interface SendEmailParams {
  businessId: string
  templateId: string
  step: number
  profileId?: string // 발신자 프로필 ID (없으면 기본 프로필 사용)
  tenantId?: string | null // 발송 주체의 테넌트 ID (멀티테넌트 격리용)
  campaignId?: string | null // 캠페인(주문) ID — 1차/팔로업 공유
}

export async function sendEmail({ businessId, templateId, step, profileId, tenantId, campaignId }: SendEmailParams) {
  // 0. 캠페인 한도 체크 (계약 수량 초과 시 발송 차단)
  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return { error: '캠페인 없음', skipped: true }
    if (campaign.status === 'paused') return { error: '캠페인 일시정지', skipped: true }
    if (campaign.status === 'completed') return { error: '캠페인 완료 (계약 수량 도달)', skipped: true }
    if (campaign.currentTotal >= campaign.targetTotal) {
      // 자동 completed 처리
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'completed', finishedAt: new Date() },
      })
      return { error: '계약 수량 도달 — 캠페인 자동 완료', skipped: true }
    }
  }

  // 1. 업체 정보
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business?.email) return { error: '이메일 없음', skipped: true }

  // 2. 수신거부 체크
  const unsubscribed = await prisma.unsubscribe.findUnique({ where: { email: business.email } })
  if (unsubscribed) return { error: '수신거부된 이메일', skipped: true }

  // 3. 반송 체크
  if (business.status === 'bounced') return { error: '반송된 이메일', skipped: true }
  if (business.status === 'unsubscribed') return { error: '수신거부 상태', skipped: true }

  // 3-1. 이메일 유효성 검증 (SMTP 레벨 — 존재하지 않는 이메일 사전 차단)
  try {
    const verification = await verifyEmail(business.email)
    if (!verification.valid) {
      // 존재하지 않는 이메일 → bounced 처리
      await prisma.business.update({
        where: { id: businessId },
        data: { status: 'bounced' },
      })
      return { error: `이메일 검증 실패 (${verification.reason})`, skipped: true }
    }
  } catch {
    // 검증 실패해도 발송은 계속 (검증이 불가능한 경우)
  }

  // 4. 야간 시간 체크 (21시~08시 발송 금지) - 실서비스 시 활성화
  // const hour = new Date().getUTCHours() + 9 // KST
  // if (hour >= 21 || hour < 8) {
  //   return { error: '야간 발송 제한 (21시~08시)', skipped: true }
  // }

  // 6. 템플릿 렌더링
  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } })
  if (!template) return { error: '템플릿 없음', skipped: true }

  // 5. 중복 발송 체크 (같은 브랜드로 이미 보낸 경우만 제외)
  const alreadySent = await prisma.emailSend.findFirst({
    where: {
      businessId,
      step,
      status: { in: ['sent', 'delivered', 'queued'] },
      ...(template.category ? { template: { category: template.category } } : {}),
    },
  })
  if (alreadySent) return { error: `${step}차 이미 발송됨 (${template.category || '기본'})`, skipped: true }

  const { subject, body } = renderTemplate(template, business)

  // 7. 발송 기록 먼저 생성 (queued 상태) + 렌더링된 내용 저장
  const send = await prisma.emailSend.create({
    data: {
      tenantId: tenantId ?? undefined,
      campaignId: campaignId ?? undefined,
      businessId,
      templateId,
      step,
      status: 'queued',
      renderedSubject: subject,
      renderedBody: body,
    },
  })

  try {
    // 8. 발신자 프로필 로드
    let senderName = '셀포'
    let senderEmail = 'info@sellpo.kr'
    if (profileId) {
      const profile = await prisma.senderProfile.findUnique({ where: { id: profileId } })
      if (profile) {
        senderName = profile.senderName
        senderEmail = profile.senderEmail
      }
    } else {
      // 기본 프로필 사용
      const defaultProfile = await prisma.senderProfile.findFirst({ where: { isDefault: true } })
      if (defaultProfile) {
        senderName = defaultProfile.senderName
        senderEmail = defaultProfile.senderEmail
      }
    }

    // 9. Brevo API로 발송 (Reply-To는 Gmail로 설정)
    const replyToEmail = process.env.REPLY_TO_EMAIL || 'skykee91@gmail.com'
    const result = await brevo.sendTransacEmail({
      sender: { name: senderName, email: senderEmail },
      replyTo: { name: senderName, email: replyToEmail },
      to: [{ email: business.email, name: business.name }],
      subject,
      htmlContent: body,
    })

    // 9. 발송 성공 기록
    await prisma.emailSend.update({
      where: { id: send.id },
      data: {
        brevoMessageId: result.messageId,
        status: 'sent',
        sentAt: new Date(),
      },
    })

    // 10. 캠페인 카운터 증가 + 한도 도달 시 자동 완료
    if (campaignId) {
      const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: { currentTotal: { increment: 1 } },
      })
      if (updated.currentTotal >= updated.targetTotal && updated.status !== 'completed') {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: 'completed', finishedAt: new Date() },
        })
      }
    }

    return { success: true, messageId: result.messageId, sendId: send.id }
  } catch (error) {
    // 발송 실패 기록
    await prisma.emailSend.update({
      where: { id: send.id },
      data: { status: 'bounced', bounceReason: String(error) },
    })
    return { error: String(error), skipped: false }
  }
}

// 대량 발송 (필터 기반, A/B 테스트 지원)
export async function sendBulkEmails(params: {
  templateId: string
  templateIdB?: string  // A/B 테스트: B 변형 템플릿 ID (없으면 일반 발송)
  step: number
  filters: {
    category?: string
    region?: string
  }
  maxCount: number
  dryRun?: boolean
  profileId?: string
  tenantId?: string | null  // 발송 주체의 테넌트 ID
  campaignId?: string | null // 캠페인 ID
  delaySeconds?: number  // 이메일 간 딜레이 (초). 기본 5초
  // 후보 조회+필터링 직후 호출. 진행바의 분모(totalTargets)를 maxCount 대신
  // 실제 대상 수로 갱신하기 위해 사용.
  onStart?: (info: { totalTargets: number }) => void
}) {
  const where: Record<string, unknown> = {
    status: 'active',
    email: { not: null },
  }
  if (params.filters.category) where.category = params.filters.category
  if (params.filters.region) where.region = { contains: params.filters.region }

  // 선택한 템플릿의 브랜드(category) 확인
  const selectedTemplate = await prisma.emailTemplate.findUnique({
    where: { id: params.templateId },
    select: { category: true },
  })
  const brandCategory = selectedTemplate?.category

  // 이미 "해당 브랜드"로 step 보낸 업체만 제외
  // (다른 브랜드로 보냈어도 이 브랜드로 안 보냈으면 대상 포함)
  if (brandCategory) {
    where.emailSends = {
      none: {
        step: params.step,
        status: { in: ['sent', 'delivered', 'queued'] },
        template: { category: brandCategory },
      },
    }
  } else {
    // 브랜드 없는 템플릿이면 기존 로직 (전체 step 기준)
    where.emailSends = { none: { step: params.step, status: { in: ['sent', 'delivered', 'queued'] } } }
  }

  // 수신거부 업체 제외
  where.unsubscribe = null

  // 브랜드 필터링을 위해 더 많이 가져와서 필터 후 자른다
  const fetchLimit = brandCategory ? params.maxCount * 5 : params.maxCount
  const allBusinesses = await prisma.business.findMany({
    where,
    take: fetchLimit,
    orderBy: { createdAt: 'asc' },
  })

  // 브랜드 타겟 업종만 필터링
  const businesses = allBusinesses
    .filter(b => isTargetCategory(brandCategory || null, b.category))
    .slice(0, params.maxCount)

  // 진행바 분모를 실제 대상 수로 갱신
  if (params.onStart && !params.dryRun) {
    try {
      params.onStart({ totalTargets: businesses.length })
    } catch (e) {
      console.error('[sendBulkEmails] onStart 콜백 오류:', e)
    }
  }

  // A/B 테스트: 대상을 랜덤으로 절반씩 나누기
  const isABTest = !!params.templateIdB
  let groupA = businesses
  let groupB: typeof businesses = []

  if (isABTest) {
    // 랜덤 셔플 후 절반 나누기
    const shuffled = [...businesses].sort(() => Math.random() - 0.5)
    const half = Math.ceil(shuffled.length / 2)
    groupA = shuffled.slice(0, half)
    groupB = shuffled.slice(half)
  }

  if (params.dryRun) {
    return {
      dryRun: true,
      totalTargets: businesses.length,
      ...(isABTest ? {
        abTest: true,
        groupA: { count: groupA.length, templateId: params.templateId },
        groupB: { count: groupB.length, templateId: params.templateIdB },
      } : {}),
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        category: b.category,
        region: b.region,
      })),
    }
  }

  const results = {
    sent: 0,
    skipped: 0,
    errors: [] as string[],
    ...(isABTest ? { abTest: true, groupA: { sent: 0, skipped: 0 }, groupB: { sent: 0, skipped: 0 } } : {}),
  }

  // 발송 딜레이: 기본 5초 (시간당 약 720건, 스팸 필터 회피)
  const delayMs = (params.delaySeconds ?? 5) * 1000

  // 그룹 A 발송
  for (let i = 0; i < groupA.length; i++) {
    const biz = groupA[i]
    const result = await sendEmail({
      businessId: biz.id,
      templateId: params.templateId,
      step: params.step,
      profileId: params.profileId,
      tenantId: params.tenantId,
      campaignId: params.campaignId,
    })

    if (result.success) {
      results.sent++
      if (isABTest) results.groupA!.sent++
    } else {
      results.skipped++
      if (isABTest) results.groupA!.skipped++
      if (result.error) results.errors.push(`${biz.name}: ${result.error}`)
    }

    // 마지막 건은 딜레이 안 함
    if (i < groupA.length - 1 && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  // 그룹 B 발송 (A/B 테스트일 때만)
  for (let i = 0; i < groupB.length; i++) {
    const biz = groupB[i]
    const result = await sendEmail({
      businessId: biz.id,
      templateId: params.templateIdB!,
      step: params.step,
      profileId: params.profileId,
      tenantId: params.tenantId,
      campaignId: params.campaignId,
    })

    if (result.success) {
      results.sent++
      if (isABTest) results.groupB!.sent++
    } else {
      results.skipped++
      if (isABTest) results.groupB!.skipped++
      if (result.error) results.errors.push(`${biz.name}: ${result.error}`)
    }

    if (i < groupB.length - 1 && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  return results
}
