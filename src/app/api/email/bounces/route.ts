import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getTenantFilter } from '@/lib/tenant'

export async function GET() {
  const tenantFilter = await getTenantFilter()
  const bounces = await prisma.emailSend.findMany({
    where: { ...tenantFilter, status: 'bounced' },
    include: { business: { select: { id: true, name: true, email: true, category: true } } },
    orderBy: { bouncedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ bounces, total: bounces.length })
}
