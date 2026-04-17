import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { SENT_STATUS_FILTER } from '@/lib/stats/email-metrics'
import { getTenantFilter } from '@/lib/tenant'

// 일별 지표
// - 발송(sent) = status IN ('sent','delivered','bounced') 인 레코드 중 createdAt이 해당 날짜에 속한 것
// - 열람/클릭은 openedAt/clickedAt 시점 기준
// - 모든 시간은 KST(UTC+9) 하루 경계로 잘라서 집계

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  const tenantFilter = await getTenantFilter()
  const dailyStats = []

  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)

  for (let i = days - 1; i >= 0; i--) {
    const dateKST = new Date(nowKST)
    dateKST.setDate(dateKST.getDate() - i)
    const dateStr = dateKST.toISOString().split('T')[0]
    const start = new Date(`${dateStr}T00:00:00+09:00`)
    const end = new Date(`${dateStr}T23:59:59+09:00`)
    const range = { gte: start, lte: end }

    const [sent, delivered, opened, clicked] = await Promise.all([
      prisma.emailSend.count({
        where: { ...tenantFilter, createdAt: range, status: SENT_STATUS_FILTER },
      }),
      prisma.emailSend.count({
        where: { ...tenantFilter, createdAt: range, status: 'delivered' },
      }),
      prisma.emailSend.count({
        where: { ...tenantFilter, createdAt: range, openedAt: { not: null } },
      }),
      prisma.emailSend.count({
        where: { ...tenantFilter, createdAt: range, clickedAt: { not: null } },
      }),
    ])

    dailyStats.push({
      date: dateStr,
      sent,
      delivered,
      opened,
      clicked,
    })
  }

  return NextResponse.json({ days, daily: dailyStats })
}
