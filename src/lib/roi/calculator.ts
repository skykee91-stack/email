// ROI 계산
// 이메일 지표는 공통 함수(getEmailMetrics)를 사용해 다른 통계 API와 숫자가 일치하도록 한다.

import { prisma } from '@/lib/prisma'
import { getEmailMetrics } from '@/lib/stats/email-metrics'

export async function calculateROI(startDate: Date, endDate: Date) {
  const range = { gte: startDate, lte: endDate }
  const metrics = await getEmailMetrics(range)

  const deals = await prisma.deal.findMany({ where: { createdAt: range } })
  const meetings = deals.filter((d) => d.stage === 'meeting' || d.stage === 'contracted').length
  const contracts = deals.filter((d) => d.stage === 'contracted').length
  const revenue = deals
    .filter((d) => d.stage === 'contracted' && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  const emailCost = metrics.sent * 13 // 건당 약 13원
  const totalCost = emailCost
  const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0
  const cac = contracts > 0 ? totalCost / contracts : 0

  return {
    period: { start: startDate, end: endDate },
    funnel: {
      sent: metrics.sent,
      delivered: metrics.delivered,
      opened: metrics.opened,
      clicked: metrics.clicked,
      replied: metrics.replied,
      bounced: metrics.bounced,
      meetings,
      contracts,
    },
    rates: {
      deliveryRate: metrics.rates.deliveryRate,
      openRate: metrics.rates.openRate,
      clickRate: metrics.rates.clickRate,
      replyRate: metrics.rates.replyRate,
    },
    revenue: { total: revenue, perEmail: metrics.sent > 0 ? revenue / metrics.sent : 0 },
    costs: { email: emailCost, total: totalCost },
    metrics: { roi, cac },
  }
}
