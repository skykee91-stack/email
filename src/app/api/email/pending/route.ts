import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 업종별 미발송 업체 현황
export async function GET() {
  try {
    // 1차 미발송: active 업체 중 1차 발송 기록 없는 것
    const unsent1 = await prisma.business.findMany({
      where: {
        status: 'active',
        email: { not: null },
        emailSends: { none: { step: 1 } },
      },
      select: { category: true },
    })

    // 업종별 그룹핑
    const unsent1ByCategory: Record<string, number> = {}
    for (const b of unsent1) {
      const cat = b.category || '미분류'
      unsent1ByCategory[cat] = (unsent1ByCategory[cat] || 0) + 1
    }

    // 2차 대기: 1차 발송 후 3일 경과 + 답장 없음 + 2차 미발송
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const pending2 = await prisma.emailSend.findMany({
      where: {
        step: 1,
        status: { in: ['sent', 'delivered'] },
        sentAt: { lte: threeDaysAgo },
        repliedAt: null,
        business: {
          status: 'active',
          emailSends: { none: { step: 2 } },
        },
      },
      include: { business: { select: { category: true } } },
    })

    const pending2ByCategory: Record<string, number> = {}
    for (const s of pending2) {
      const cat = s.business.category || '미분류'
      pending2ByCategory[cat] = (pending2ByCategory[cat] || 0) + 1
    }

    return NextResponse.json({
      unsent1: {
        total: unsent1.length,
        byCategory: Object.entries(unsent1ByCategory)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      },
      pending2: {
        total: pending2.length,
        byCategory: Object.entries(pending2ByCategory)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
