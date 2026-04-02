// 테스트 데이터 초기화 API (개발용)
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 순서 중요: 외래키 의존성 순서대로 삭제
    await prisma.pageVisit.deleteMany()
    await prisma.hotLead.deleteMany()
    await prisma.deal.deleteMany()
    await prisma.emailSend.deleteMany()
    await prisma.unsubscribe.deleteMany()
    await prisma.scrapeJob.deleteMany()
    await prisma.emailTemplate.deleteMany()
    await prisma.business.deleteMany()

    return NextResponse.json({ ok: true, message: '모든 데이터 초기화 완료' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
