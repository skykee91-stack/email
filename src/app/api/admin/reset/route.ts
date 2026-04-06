import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const d1 = await prisma.deal.deleteMany({})
    const d2 = await prisma.hotLead.deleteMany({})
    const d3 = await prisma.pageVisit.deleteMany({})
    const d4 = await prisma.emailSend.deleteMany({})
    const d5 = await prisma.unsubscribe.deleteMany({})
    const d6 = await prisma.scrapeJob.deleteMany({})
    const d7 = await prisma.business.deleteMany({})

    return NextResponse.json({
      message: '초기화 완료',
      deleted: { deals: d1.count, hotLeads: d2.count, pageVisits: d3.count, emailSends: d4.count, unsubscribes: d5.count, scrapeJobs: d6.count, businesses: d7.count },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
