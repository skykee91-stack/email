import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  const result = await prisma.scrapeJob.updateMany({
    where: { status: { in: ['running', 'pending'] }, totalFound: 0 },
    data: { status: 'failed', errorMessage: '서버 재시작으로 중단됨', finishedAt: new Date() }
  })
  return NextResponse.json({ cleaned: result.count })
}
