import { calculateROI } from '@/lib/roi/calculator'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const roi = await calculateROI(startDate, endDate)
  return NextResponse.json(roi)
}

// 거래(계약) 등록
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.businessId) return NextResponse.json({ error: 'businessId 필수' }, { status: 400 })

  const deal = await prisma.deal.create({
    data: {
      businessId: body.businessId,
      stage: body.stage || 'replied',
      amount: body.amount || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ deal }, { status: 201 })
}
