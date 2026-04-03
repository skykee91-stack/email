// 이메일 발송 엔진
// 발송 전 모든 체크(수신거부, 반송, 야간, 중복 등)를 거침

import { prisma } from '@/lib/prisma'
import { brevo } from '@/lib/brevo'
import { renderTemplate } from '@/lib/email/template'

interface SendEmailParams {
  businessId: string
  templateId: string
  step: number
  profileId?: string // 발신자 프로필 ID (없으면 기본 프로필 사용)
}

export async function sendEmail({ businessId, templateId, step, profileId }: SendEmailParams) {
  // 1. 업체 정보
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business?.email) return { error: '이메일 없음', skipped: true }

  // 2. 수신거부 체크
  const unsubscribed = await prisma.unsubscribe.findUnique({ where: { email: business.email } })
  if (unsubscribed) return { error: '수신거부된 이메일', skipped: true }

  // 3. 반송 체크
  if (business.status === 'bounced') return { error: '반송된 이메일', skipped: true }
  if (business.status === 'unsubscribed') return { error: '수신거부 상태', skipped: true }

  // 4. 야간 시간 체크 (21시~08시 발송 금지) - 실서비스 시 활성화
  // const hour = new Date().getUTCHours() + 9 // KST
  // if (hour >= 21 || hour < 8) {
  //   return { error: '야간 발송 제한 (21시~08시)', skipped: true }
  // }

  // 5. 중복 발송 체크
  const alreadySent = await prisma.emailSend.findFirst({
    where: { businessId, step, status: { in: ['sent', 'delivered', 'queued'] } },
  })
  if (alreadySent) return { error: `${step}차 이미 발송됨`, skipped: true }

  // 6. 템플릿 렌더링
  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } })
  if (!template) return { error: '템플릿 없음', skipped: true }

  const { subject, body } = renderTemplate(template, business)

  // 7. 발송 기록 먼저 생성 (queued 상태)
  const send = await prisma.emailSend.create({
    data: {
      businessId,
      templateId,
      step,
      status: 'queued',
    },
  })

  try {
    // 8. 발신자 프로필 로드
    let senderName = '셀포 by 마스터인사이트'
    let senderEmail = 'skykee91@gmail.com'
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

    // 9. Brevo API로 발송
    const result = await brevo.sendTransacEmail({
      sender: { name: senderName, email: senderEmail },
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

// 대량 발송 (필터 기반)
export async function sendBulkEmails(params: {
  templateId: string
  step: number
  filters: {
    category?: string
    region?: string
  }
  maxCount: number
  dryRun?: boolean
}) {
  const where: Record<string, unknown> = {
    status: 'active',
    email: { not: null },
  }
  if (params.filters.category) where.category = params.filters.category
  if (params.filters.region) where.region = { contains: params.filters.region }

  // 이미 해당 step 보낸 업체 제외
  where.emailSends = { none: { step: params.step, status: { in: ['sent', 'delivered', 'queued'] } } }
  // 수신거부 업체 제외
  where.unsubscribe = null

  const businesses = await prisma.business.findMany({
    where,
    take: params.maxCount,
    orderBy: { createdAt: 'asc' },
  })

  if (params.dryRun) {
    return {
      dryRun: true,
      totalTargets: businesses.length,
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        category: b.category,
        region: b.region,
      })),
    }
  }

  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  for (const biz of businesses) {
    const result = await sendEmail({
      businessId: biz.id,
      templateId: params.templateId,
      step: params.step,
    })

    if (result.success) {
      results.sent++
    } else {
      results.skipped++
      if (result.error) results.errors.push(`${biz.name}: ${result.error}`)
    }
  }

  return results
}
