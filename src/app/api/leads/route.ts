import { prisma } from '@/lib/prisma'
import { recalculateAllScores } from '@/lib/leads/scorer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tier = searchParams.get('tier')
  const limit = parseInt(searchParams.get('limit') || '30')

  const where: Record<string, unknown> = {}
  if (tier) where.tier = tier

  const leads = await prisma.hotLead.findMany({
    where,
    include: { business: { select: { name: true, email: true, category: true, region: true, phone: true } } },
    orderBy: { score: 'desc' },
    take: limit,
  })

  const tierCounts = {
    S: await prisma.hotLead.count({ where: { tier: 'S' } }),
    A: await prisma.hotLead.count({ where: { tier: 'A' } }),
    B: await prisma.hotLead.count({ where: { tier: 'B' } }),
    C: await prisma.hotLead.count({ where: { tier: 'C' } }),
  }

  return NextResponse.json({ leads, tierCounts, total: leads.length })
}

// 점수 재계산
export async function POST() {
  const result = await recalculateAllScores()
  return NextResponse.json(result)
}
