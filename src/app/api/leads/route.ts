import { prisma } from '@/lib/prisma'
import { recalculateAllScores } from '@/lib/leads/scorer'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantFilter } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tier = searchParams.get('tier')
  const limit = parseInt(searchParams.get('limit') || '30')

  const tenantFilter = await getTenantFilter()
  const where: Record<string, unknown> = { ...tenantFilter }
  if (tier) where.tier = tier

  const leads = await prisma.hotLead.findMany({
    where,
    include: {
      business: {
        select: {
          name: true, email: true, category: true, region: true, phone: true,
          // 어떤 이메일에서 활동을 보였는지 추적용 — 발송 이력 전부 펼침 (UI 에서 브랜드+차수별 표시)
          emailSends: {
            select: {
              step: true,
              openCount: true,
              clickCount: true,
              sentAt: true,
              repliedAt: true,
              status: true,
              template: { select: { category: true, name: true } },
            },
            orderBy: { sentAt: 'desc' },
          },
        },
      },
    },
    orderBy: { score: 'desc' },
    take: limit,
  })

  const tierCounts = {
    S: await prisma.hotLead.count({ where: { ...tenantFilter, tier: 'S' } }),
    A: await prisma.hotLead.count({ where: { ...tenantFilter, tier: 'A' } }),
    B: await prisma.hotLead.count({ where: { ...tenantFilter, tier: 'B' } }),
    C: await prisma.hotLead.count({ where: { ...tenantFilter, tier: 'C' } }),
  }

  return NextResponse.json({ leads, tierCounts, total: leads.length })
}

// 점수 재계산
export async function POST() {
  const result = await recalculateAllScores()
  return NextResponse.json(result)
}
