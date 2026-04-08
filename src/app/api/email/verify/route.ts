import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmail } from '@/lib/email/verify'

// POST: 특정 이메일 검증
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: '이메일을 입력하세요' }, { status: 400 })

  const result = await verifyEmail(email)
  return NextResponse.json({ email, ...result })
}

// GET: active 상태 업체 일괄 검증 (반송 예방)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const dryRun = searchParams.get('dryRun') === 'true'

  // active 상태이면서 아직 검증 안 한 업체 (이메일 있는 것만)
  const businesses = await prisma.business.findMany({
    where: {
      status: 'active',
      email: { not: null },
    },
    select: { id: true, name: true, email: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  if (dryRun) {
    return NextResponse.json({ dryRun: true, total: businesses.length })
  }

  let valid = 0
  let invalid = 0
  const invalidList: { name: string; email: string; reason: string }[] = []

  for (const biz of businesses) {
    if (!biz.email) continue
    const result = await verifyEmail(biz.email)

    if (!result.valid) {
      invalid++
      invalidList.push({ name: biz.name, email: biz.email, reason: result.reason })
      // bounced 처리
      await prisma.business.update({
        where: { id: biz.id },
        data: { status: 'bounced' },
      })
    } else {
      valid++
    }

    // 속도 제한
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({
    total: businesses.length,
    valid,
    invalid,
    invalidList,
  })
}
