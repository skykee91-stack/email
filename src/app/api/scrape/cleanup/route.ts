import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 멈춘 수집 작업 정리
// - running/pending 중 startedAt이 30분 이상 지난 작업을 failed 처리
// - startedAt이 null인 pending은 createdAt 기준으로 판단
export async function POST() {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  const result = await prisma.scrapeJob.updateMany({
    where: {
      status: { in: ['running', 'pending'] },
      OR: [
        { startedAt: { lt: thirtyMinAgo } },
        { startedAt: null, createdAt: { lt: thirtyMinAgo } },
      ],
    },
    data: {
      status: 'failed',
      errorMessage: '멈춘 작업 자동 정리',
      finishedAt: new Date(),
    },
  })
  return NextResponse.json({ cleaned: result.count })
}
