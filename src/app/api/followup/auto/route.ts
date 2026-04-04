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
    const profileId = body.profileId || undefined

    // 각 단계별 템플릿 찾기
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { step: 'asc' },
    })
    const templateByStep: Record<number, string> = {}
    for (const t of templates) {
      if (!templateByStep[t.step]) {
        templateByStep[t.step] = t.id
      }
    }

    const allResults: Array<{
      step: number
      candidates: number
      sent: number
      skipped: number
      targets?: Array<{ name: string; email: string }>
    }> = []

    for (const schedule of FOLLOWUP_SCHEDULE) {
      const { step, delayDays, prevStep } = schedule
      const templateId = templateByStep[step]

      if (!templateId && !dryRun) {
        allResults.push({ step, candidates: 0, sent: 0, skipped: 0 })
        continue
      }

      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - delayDays)

      // 조건: 이전 단계 발송 완료 + 이 단계 미발송 + 답장 없음 + 활성 업체
      const candidates = await prisma.emailSend.findMany({
        where: {
          step: prevStep,
          status: { in: ['sent', 'delivered'] },
          sentAt: { lte: targetDate },
          repliedAt: null,
          business: {
            status: 'active',
            emailSends: { none: { step } },
          },
        },
        include: {
          business: { select: { id: true, name: true, email: true } },
        },
        take: 200,
      })

      if (dryRun) {
        allResults.push({
          step,
          candidates: candidates.length,
          sent: 0,
          skipped: 0,
          targets: candidates.map(c => ({
            name: c.business.name,
            email: c.business.email || '',
          })),
        })
        continue
      }

      let sent = 0
      let skipped = 0

      for (const candidate of candidates) {
        if (!templateId) { skipped++; continue }
        const result = await sendEmail({
          businessId: candidate.businessId,
          templateId,
          step,
          profileId,
        })
        if (result.success) {
          sent++
        } else {
          skipped++
        }
      }

      allResults.push({ step, candidates: candidates.length, sent, skipped })
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

// GET: 팔로업 현황 요약
export async function GET() {
  try {
    const results = []

    for (const schedule of FOLLOWUP_SCHEDULE) {
      const { step, delayDays, prevStep } = schedule
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - delayDays)

      const candidates = await prisma.emailSend.count({
        where: {
          step: prevStep,
          status: { in: ['sent', 'delivered'] },
          sentAt: { lte: targetDate },
          repliedAt: null,
          business: {
            status: 'active',
            emailSends: { none: { step } },
          },
        },
      })

      const alreadySent = await prisma.emailSend.count({
        where: { step },
      })

      results.push({
        step,
        label: `${step}차 팔로업`,
        delayDays,
        pendingCount: candidates,
        sentCount: alreadySent,
        description: `1차 발송 ${delayDays}일 후 자동 발송`,
      })
    }

    // 1차 발송 현황
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
