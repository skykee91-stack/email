import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { startSyncCron } from '@/lib/email/sync'

// 크론 자동 시작 (stats 페이지 접근 시)
startSyncCron()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const dateFilter = { gte: startDate }

  const [sent, delivered, opened, clicked, bounced, replied] = await Promise.all([
    prisma.emailSend.count({ where: { sentAt: dateFilter } }),
    prisma.emailSend.count({ where: { deliveredAt: dateFilter } }),
    prisma.emailSend.count({ where: { openedAt: dateFilter } }),
    prisma.emailSend.count({ where: { clickedAt: dateFilter } }),
    prisma.emailSend.count({ where: { status: 'bounced', createdAt: dateFilter } }),
    prisma.emailSend.count({ where: { repliedAt: dateFilter } }),
  ])

  const unsubscribed = await prisma.unsubscribe.count({ where: { unsubscribedAt: dateFilter } })

  return NextResponse.json({
    days,
    funnel: { sent, delivered, opened, clicked, bounced, replied, unsubscribed },
    rates: {
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
      openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0',
      clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0',
      bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(1) : '0',
      replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
    },
  })
}
