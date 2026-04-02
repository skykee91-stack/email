import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const bounces = await prisma.emailSend.findMany({
    where: { status: 'bounced' },
    include: { business: { select: { id: true, name: true, email: true, category: true } } },
    orderBy: { bouncedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ bounces, total: bounces.length })
}
