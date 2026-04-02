import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// 수신거부 해제
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return NextResponse.json({ error: 'email 필수' }, { status: 400 })

    // 수신거부 삭제
    await prisma.unsubscribe.deleteMany({ where: { email: body.email } })

    // 업체 상태 복구
    await prisma.business.updateMany({
      where: { email: body.email, status: 'unsubscribed' },
      data: { status: 'active' },
    })

    return NextResponse.json({ ok: true, message: `${body.email} 수신거부 해제됨` })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
