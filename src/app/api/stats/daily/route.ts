import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')

  const dailyStats = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const range = { gte: start, lt: end }

    const [sent, opened, clicked] = await Promise.all([
      prisma.emailSend.count({ where: { sentAt: range } }),
      prisma.emailSend.count({ where: { openedAt: range } }),
      prisma.emailSend.count({ where: { clickedAt: range } }),
    ])

    dailyStats.push({
      date: start.toISOString().split('T')[0],
      sent,
      opened,
      clicked,
    })
  }

  return NextResponse.json({ days, daily: dailyStats })
}
