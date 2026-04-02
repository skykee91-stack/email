// ROI 계산

import { prisma } from '@/lib/prisma'

export async function calculateROI(startDate: Date, endDate: Date) {
  const dateFilter = { gte: startDate, lte: endDate }

  const [sent, delivered, opened, clicked, replied] = await Promise.all([
    prisma.emailSend.count({ where: { sentAt: dateFilter } }),
    prisma.emailSend.count({ where: { deliveredAt: dateFilter } }),
    prisma.emailSend.count({ where: { openedAt: dateFilter } }),
    prisma.emailSend.count({ where: { clickedAt: dateFilter } }),
    prisma.emailSend.count({ where: { repliedAt: dateFilter } }),
  ])

  const deals = await prisma.deal.findMany({ where: { createdAt: dateFilter } })
  const meetings = deals.filter((d) => d.stage === 'meeting' || d.stage === 'contracted').length
  const contracts = deals.filter((d) => d.stage === 'contracted').length
  const revenue = deals.filter((d) => d.stage === 'contracted' && d.amount).reduce((sum, d) => sum + (d.amount || 0), 0)

  const emailCost = sent * 13 // 건당 약 13원
  const totalCost = emailCost
  const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0
  const cac = contracts > 0 ? totalCost / contracts : 0

  return {
    period: { start: startDate, end: endDate },
    funnel: { sent, delivered, opened, clicked, replied, meetings, contracts },
    rates: {
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    },
    revenue: { total: revenue, perEmail: sent > 0 ? revenue / sent : 0 },
    costs: { email: emailCost, total: totalCost },
    metrics: { roi, cac },
  }
}
