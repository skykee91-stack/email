import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// 현재 또는 특정 작업의 진행 상황 + 스킵 로그
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  // jobId 없으면 가장 최근 작업
  let targetJobId = jobId
  if (!targetJobId) {
    const latest = await prisma.scrapeJob.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    targetJobId = latest?.id || null
  }

  if (!targetJobId) {
    return NextResponse.json({ progress: null, skipLogs: [], skipSummary: {} })
  }

  const [progress, skipLogs] = await Promise.all([
    prisma.scrapeProgress.findUnique({ where: { jobId: targetJobId } }),
    prisma.scrapeSkipLog.findMany({
      where: { jobId: targetJobId },
      orderBy: { skippedAt: 'desc' },
      take: 100,
    }),
  ])

  // 사유별 집계
  const skipSummary: Record<string, number> = {}
  for (const log of skipLogs) {
    skipSummary[log.reason] = (skipSummary[log.reason] || 0) + 1
  }

  return NextResponse.json({
    jobId: targetJobId,
    progress,
    skipLogs,
    skipSummary,
    totalSkipped: skipLogs.length,
  })
}
