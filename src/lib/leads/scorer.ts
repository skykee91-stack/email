// 핫 리드 점수 계산

import { prisma } from '@/lib/prisma'

export async function calculateLeadScore(businessId: string) {
  const sends = await prisma.emailSend.findMany({ where: { businessId } })

  const totalOpens = sends.reduce((sum, s) => sum + s.openCount, 0)
  const totalClicks = sends.reduce((sum, s) => sum + s.clickCount, 0)
  const hasReplied = sends.some((s) => s.repliedAt !== null)

  const visits = await prisma.pageVisit.findMany({ where: { businessId } })
  const totalVisits = visits.length
  const maxScroll = visits.length > 0 ? Math.max(...visits.map((v) => v.scrollPercent)) : 0
  const maxDuration = visits.length > 0 ? Math.max(...visits.map((v) => v.durationSeconds)) : 0

  let score = 0
  score += totalOpens * 1
  score += totalClicks * 3
  score += maxScroll >= 50 ? 2 : 0
  score += maxDuration >= 30 ? 2 : 0
  score += hasReplied ? 10 : 0
  if (totalOpens >= 3) score *= 1.5

  let tier: string
  if (score >= 20) tier = 'S'
  else if (score >= 12) tier = 'A'
  else if (score >= 5) tier = 'B'
  else tier = 'C'

  // 가장 최신 발송의 tenantId 를 hotLead 에 기록 (Phase 1 에선 unique 제약 유지라 1업체 1hotLead)
  const latestSend = sends.length > 0
    ? sends.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null
  const tenantId = latestSend?.tenantId ?? null

  await prisma.hotLead.upsert({
    where: { businessId },
    update: {
      tenantId: tenantId ?? undefined,
      score, tier, totalOpens, totalClicks, totalVisits, maxScroll, maxDuration, hasReplied, lastActivity: new Date(),
    },
    create: {
      tenantId: tenantId ?? undefined,
      businessId, score, tier, totalOpens, totalClicks, totalVisits, maxScroll, maxDuration, hasReplied, lastActivity: new Date(),
    },
  })

  return { score, tier }
}

export async function recalculateAllScores() {
  const businesses = await prisma.business.findMany({
    where: { emailSends: { some: {} } },
    select: { id: true },
  })

  let updated = 0
  for (const biz of businesses) {
    await calculateLeadScore(biz.id)
    updated++
  }
  return { updated }
}
