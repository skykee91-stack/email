import { NextRequest, NextResponse } from 'next/server'
import { startSyncCron } from '@/lib/email/sync'
import { getDateRangeFromDays, getEmailMetrics } from '@/lib/stats/email-metrics'

// 크론 자동 시작 (stats 페이지 접근 시)
startSyncCron()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  const range = getDateRangeFromDays(days)
  const metrics = await getEmailMetrics(range)

  return NextResponse.json({
    days,
    funnel: {
      sent: metrics.sent,
      delivered: metrics.delivered,
      opened: metrics.opened,
      clicked: metrics.clicked,
      bounced: metrics.bounced,
      replied: metrics.replied,
      unsubscribed: metrics.unsubscribed,
    },
    rates: {
      deliveryRate: metrics.rates.deliveryRate.toFixed(1),
      openRate: metrics.rates.openRate.toFixed(1),
      clickRate: metrics.rates.clickRate.toFixed(1),
      bounceRate: metrics.rates.bounceRate.toFixed(1),
      replyRate: metrics.rates.replyRate.toFixed(1),
    },
  })
}
