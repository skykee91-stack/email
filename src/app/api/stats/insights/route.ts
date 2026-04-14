// 성과 분석 API
// 업종별, 템플릿별, 단계별 이메일 성과를 분석해서
// 다음 발송 전에 참고할 수 있는 인사이트 제공.
//
// funnel/daily/roi API와 숫자를 일치시키기 위해
// - "발송" 정의: status IN ('sent','delivered','bounced')
// - 기간 필터: createdAt (default 30일)
// - 비율: openRate/clickRate = opened/clicked / delivered

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import {
  getDateRangeFromDays,
  getEmailMetrics,
} from '@/lib/stats/email-metrics'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const range = getDateRangeFromDays(days)

    // 0. 요약 (공통 함수 사용 → funnel/roi와 완전히 동일한 숫자)
    const metrics = await getEmailMetrics(range)

    // 공통 조건: 발송된 메일만, 지정 기간
    const whereSQL = `
      e."createdAt" >= $1
      AND e.status IN ('sent', 'delivered', 'bounced')
    `

    // 1. 업종별 성과 (LEFT JOIN으로 변경 — Business 삭제된 것도 '미분류'로 포함)
    const categoryStats = (await prisma.$queryRawUnsafe(
      `
      SELECT
        COALESCE(b.category, '미분류') AS category,
        COUNT(DISTINCT e.id) AS total_sent,
        COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) AS delivered,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) AS opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) AS clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) AS replied,
        COUNT(DISTINCT CASE WHEN e.status = 'bounced' THEN e.id END) AS bounced
      FROM "EmailSend" e
      LEFT JOIN "Business" b ON e."businessId" = b.id
      WHERE ${whereSQL}
      GROUP BY COALESCE(b.category, '미분류')
      ORDER BY COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) DESC
      `,
      range.gte,
    )) as Array<Record<string, unknown>>

    const categoryInsights = categoryStats.map((row) => {
      const sent = Number(row.total_sent) || 0
      const delivered = Number(row.delivered) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      const bounced = Number(row.bounced) || 0
      const denom = delivered > 0 ? delivered : sent
      return {
        category: (row.category as string) || '미분류',
        sent,
        delivered,
        opened,
        clicked,
        replied,
        bounced,
        openRate: denom > 0 ? ((opened / denom) * 100).toFixed(1) : '0',
        clickRate: denom > 0 ? ((clicked / denom) * 100).toFixed(1) : '0',
        replyRate: denom > 0 ? ((replied / denom) * 100).toFixed(1) : '0',
        grade: replied > 0 ? 'S' : clicked > 0 ? 'A' : opened > 0 ? 'B' : 'C',
      }
    })

    // 2. 템플릿별 성과
    const templateStats = (await prisma.$queryRawUnsafe(
      `
      SELECT
        t.id, t.name, t.subject, t.step, t."abVariant",
        COUNT(DISTINCT e.id) AS total_sent,
        COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) AS delivered,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) AS opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) AS clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) AS replied
      FROM "EmailSend" e
      JOIN "EmailTemplate" t ON e."templateId" = t.id
      WHERE ${whereSQL}
      GROUP BY t.id, t.name, t.subject, t.step, t."abVariant"
      ORDER BY COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) DESC
      `,
      range.gte,
    )) as Array<Record<string, unknown>>

    const templateInsights = templateStats.map((row) => {
      const sent = Number(row.total_sent) || 0
      const delivered = Number(row.delivered) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      const denom = delivered > 0 ? delivered : sent
      return {
        id: row.id,
        name: row.name,
        subject: row.subject,
        step: row.step,
        abVariant: row.abVariant,
        sent,
        delivered,
        opened,
        clicked,
        replied,
        openRate: denom > 0 ? ((opened / denom) * 100).toFixed(1) : '0',
        clickRate: denom > 0 ? ((clicked / denom) * 100).toFixed(1) : '0',
        replyRate: denom > 0 ? ((replied / denom) * 100).toFixed(1) : '0',
      }
    })

    // 3. 단계별 성과
    const stepStats = (await prisma.$queryRawUnsafe(
      `
      SELECT
        e.step,
        COUNT(DISTINCT e.id) AS total_sent,
        COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) AS delivered,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) AS opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) AS clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) AS replied
      FROM "EmailSend" e
      WHERE ${whereSQL}
      GROUP BY e.step
      ORDER BY e.step
      `,
      range.gte,
    )) as Array<Record<string, unknown>>

    const stepInsights = stepStats.map((row) => {
      const sent = Number(row.total_sent) || 0
      const delivered = Number(row.delivered) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      const denom = delivered > 0 ? delivered : sent
      return {
        step: Number(row.step),
        stepLabel: `${row.step}차 발송`,
        sent,
        delivered,
        opened,
        clicked,
        replied,
        openRate: denom > 0 ? ((opened / denom) * 100).toFixed(1) : '0',
        clickRate: denom > 0 ? ((clicked / denom) * 100).toFixed(1) : '0',
        replyRate: denom > 0 ? ((replied / denom) * 100).toFixed(1) : '0',
      }
    })

    // 4. 추천
    const recommendations: Array<{
      type: string
      title: string
      detail: string
    }> = []

    if (categoryInsights.length > 0) {
      const bestCategory = categoryInsights[0]
      recommendations.push({
        type: 'best_category',
        title: `가장 반응 좋은 업종: ${bestCategory.category}`,
        detail: `열람률 ${bestCategory.openRate}%, 클릭률 ${bestCategory.clickRate}%`,
      })
    }

    if (templateInsights.length > 0) {
      const bestTemplate = templateInsights[0]
      recommendations.push({
        type: 'best_template',
        title: `가장 효과적인 템플릿: ${bestTemplate.name}`,
        detail: `열람률 ${bestTemplate.openRate}%, 제목: ${bestTemplate.subject}`,
      })
    }

    if (metrics.sent === 0) {
      recommendations.push(
        {
          type: 'tip',
          title: '아직 발송 데이터가 없습니다',
          detail:
            '이메일을 발송하면 여기서 업종별/템플릿별 성과를 분석할 수 있습니다',
        },
        {
          type: 'tip',
          title: '참고: 일반적으로 반응이 좋은 업종',
          detail: '치과, 병원, 학원 등 전문 서비스 업종이 열람률이 높습니다',
        },
      )
    }

    return NextResponse.json({
      days,
      summary: {
        // funnel/roi와 동일한 숫자
        totalSends: metrics.sent,
        totalDelivered: metrics.delivered,
        totalOpened: metrics.opened,
        totalClicked: metrics.clicked,
        totalReplied: metrics.replied,
        totalBounced: metrics.bounced,
        deliveryRate: metrics.rates.deliveryRate.toFixed(1),
        overallOpenRate: metrics.rates.openRate.toFixed(1),
        overallClickRate: metrics.rates.clickRate.toFixed(1),
        overallReplyRate: metrics.rates.replyRate.toFixed(1),
      },
      categoryInsights,
      templateInsights,
      stepInsights,
      recommendations,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '인사이트 조회 실패', detail: String(error) },
      { status: 500 },
    )
  }
}
