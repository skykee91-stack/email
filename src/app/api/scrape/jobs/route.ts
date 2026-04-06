import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// 수집 이력 조회
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page') || '1')
    const limit = Number(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') || undefined
    const category = url.searchParams.get('category') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = { contains: category }

    const [jobs, total] = await Promise.all([
      prisma.scrapeJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scrapeJob.count({ where }),
    ])

    // 전체 통계
    const stats = await prisma.scrapeJob.aggregate({
      _sum: { totalFound: true, totalSaved: true, withEmail: true },
      _count: true,
    })

    const doneJobs = await prisma.scrapeJob.count({ where: { status: 'done' } })
    const failedJobs = await prisma.scrapeJob.count({ where: { status: 'failed' } })

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalJobs: stats._count,
        doneJobs,
        failedJobs,
        totalFound: stats._sum.totalFound || 0,
        totalSaved: stats._sum.totalSaved || 0,
        totalWithEmail: stats._sum.withEmail || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
