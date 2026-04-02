// 업체 통계 API
// GET /api/businesses/stats → 전체 업체 통계

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [total, withEmail, withPhone, active, bounced, unsubscribed] =
      await Promise.all([
        prisma.business.count(),
        prisma.business.count({ where: { email: { not: null } } }),
        prisma.business.count({ where: { phone: { not: null } } }),
        prisma.business.count({ where: { status: 'active' } }),
        prisma.business.count({ where: { status: 'bounced' } }),
        prisma.business.count({ where: { status: 'unsubscribed' } }),
      ])

    return NextResponse.json({
      total,
      withEmail,
      withPhone,
      active,
      bounced,
      unsubscribed,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '통계 조회 실패', detail: String(error) },
      { status: 500 }
    )
  }
}
