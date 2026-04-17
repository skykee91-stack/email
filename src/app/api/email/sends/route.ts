import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantFilter } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const step = searchParams.get('step')
  const status = searchParams.get('status')

  const tenantFilter = await getTenantFilter()
  const where: Record<string, unknown> = { ...tenantFilter }
  if (step) where.step = parseInt(step)
  if (status) where.status = status

  const [sends, total] = await Promise.all([
    prisma.emailSend.findMany({
      where,
      include: {
        business: { select: { name: true, email: true, category: true } },
        template: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailSend.count({ where }),
  ])

  return NextResponse.json({ sends, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}
