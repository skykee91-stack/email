import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')

  const dailyStats = []

  // 한국 시간(KST, UTC+9) 기준으로 날짜 계산
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)

  for (let i = days - 1; i >= 0; i--) {
    const dateKST = new Date(nowKST)
    dateKST.setDate(dateKST.getDate() - i)
    // KST 기준 하루의 시작/끝을 UTC로 변환
    const dateStr = dateKST.toISOString().split('T')[0]
    const start = new Date(`${dateStr}T00:00:00+09:00`)
    const end = new Date(`${dateStr}T23:59:59+09:00`)

    const range = { gte: start, lte: end }

    const [sent, opened, clicked] = await Promise.all([
      prisma.emailSend.count({ where: { sentAt: range } }),
      prisma.emailSend.count({ where: { openedAt: range } }),
      prisma.emailSend.count({ where: { clickedAt: range } }),
    ])

    dailyStats.push({
      date: dateStr,
      sent,
      opened,
      clicked,
    })
  }

  return NextResponse.json({ days, daily: dailyStats })
}
