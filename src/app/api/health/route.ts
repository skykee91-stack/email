// DB 연결 상태 확인용 API
// GET /api/health 로 접속하면 DB 연결 상태를 알려줌

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // DB에서 업체 수 조회 (연결 테스트)
    const businessCount = await prisma.business.count()
    const templateCount = await prisma.emailTemplate.count()
    const sendCount = await prisma.emailSend.count()

    return NextResponse.json({
      status: 'ok',
      message: 'DB 연결 성공!',
      db: {
        businesses: businessCount,
        templates: templateCount,
        sends: sendCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'DB 연결 실패',
      error: String(error),
    }, { status: 500 })
  }
}
