// 테스트 데이터 초기화 API (개발용)
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 업체 관련 데이터만 삭제 (템플릿, 발신자 프로필은 유지)
    await prisma.pageVisit.deleteMany()
    await prisma.hotLead.deleteMany()
    await prisma.deal.deleteMany()
    await prisma.emailSend.deleteMany()
    await prisma.unsubscribe.deleteMany()
    await prisma.scrapeJob.deleteMany()
    await prisma.business.deleteMany()

    return NextResponse.json({ ok: true, message: '업체 데이터 초기화 완료 (템플릿/프로필 유지)' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
