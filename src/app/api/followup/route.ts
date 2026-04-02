import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'

// 팔로업 대상 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const step = parseInt(searchParams.get('step') || '2')
  const delayDays = parseInt(searchParams.get('delayDays') || '3')

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - delayDays)

  // 1차 발송 완료 + 답장 없음 + 해당 step 미발송 + 활성 업체
  const candidates = await prisma.emailSend.findMany({
    where: {
      step: 1,
      status: { in: ['sent', 'delivered'] },
      sentAt: { lte: targetDate },
      repliedAt: null,
      business: {
        status: 'active',
        emailSends: { none: { step } },
      },
    },
    include: { business: { select: { id: true, name: true, email: true, category: true, region: true } } },
    take: 200,
  })

  return NextResponse.json({
    step,
    delayDays,
    total: candidates.length,
    candidates: candidates.map((c) => ({
      businessId: c.business.id,
      businessName: c.business.name,
      email: c.business.email,
      category: c.business.category,
      firstSentAt: c.sentAt,
    })),
  })
}

// 팔로업 실행
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step = 2, templateId, delayDays = 3, dryRun = false, maxCount = 100 } = body

    if (!templateId && !dryRun) {
      return NextResponse.json({ error: 'templateId 필수 (dryRun이 아닌 경우)' }, { status: 400 })
    }

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - delayDays)

    const candidates = await prisma.emailSend.findMany({
      where: {
        step: 1,
        status: { in: ['sent', 'delivered'] },
        sentAt: { lte: targetDate },
        repliedAt: null,
        business: {
          status: 'active',
          emailSends: { none: { step } },
        },
      },
      include: { business: true },
      take: maxCount,
    })

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        step,
        total: candidates.length,
        targets: candidates.map((c) => ({ name: c.business.name, email: c.business.email })),
      })
    }

    const results = { sent: 0, skipped: 0, errors: [] as string[] }

    for (const candidate of candidates) {
      const result = await sendEmail({
        businessId: candidate.businessId,
        templateId,
        step,
      })
      if (result.success) results.sent++
      else {
        results.skipped++
        if (result.error) results.errors.push(`${candidate.business.name}: ${result.error}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
