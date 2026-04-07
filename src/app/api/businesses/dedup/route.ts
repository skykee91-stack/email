import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  const all = await prisma.business.findMany({ orderBy: { createdAt: 'asc' } })
  const seen = new Set<string>()
  const toDelete: string[] = []
  
  for (const b of all) {
    if (b.email && seen.has(b.email)) {
      toDelete.push(b.id)
    } else if (b.email) {
      seen.add(b.email)
    }
  }

  if (toDelete.length > 0) {
    await prisma.emailSend.deleteMany({ where: { businessId: { in: toDelete } } })
    await prisma.business.deleteMany({ where: { id: { in: toDelete } } })
  }

  return NextResponse.json({ deleted: toDelete.length, remaining: all.length - toDelete.length })
}
