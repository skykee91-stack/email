import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// 수신거부 처리 (이메일 링크에서 호출)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email || (body.token ? Buffer.from(body.token, 'base64url').toString() : null)

    if (!email) return NextResponse.json({ error: '이메일 정보 없음' }, { status: 400 })

    // 수신거부 등록
    await prisma.unsubscribe.upsert({
      where: { email },
      update: {},
      create: { email, reason: body.reason || '사용자 수신거부' },
    })

    // 해당 업체 상태 변경
    const business = await prisma.business.findFirst({ where: { email } })
    if (business) {
      await prisma.business.update({ where: { id: business.id }, data: { status: 'unsubscribed' } })
    }

    return NextResponse.json({ ok: true, message: '수신거부 처리되었습니다' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 수신거부 목록 조회
export async function GET() {
  const list = await prisma.unsubscribe.findMany({
    orderBy: { unsubscribedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ unsubscribes: list, total: list.length })
}
