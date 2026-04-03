// 성과 분석 API
// 업종별, 템플릿별, 시간대별 이메일 성과를 분석해서
// 다음 발송 전에 참고할 수 있는 인사이트 제공

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 1. 업종별 성과 (어떤 업종이 이메일을 잘 열고 클릭하는지)
    const categoryStats = await prisma.$queryRawUnsafe(`
      SELECT
        b.category,
        COUNT(DISTINCT e.id) as total_sent,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) as opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) as clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) as replied,
        COUNT(DISTINCT CASE WHEN e.status = 'bounced' THEN e.id END) as bounced
      FROM "EmailSend" e
      JOIN "Business" b ON e."businessId" = b.id
      WHERE e.status IN ('sent', 'delivered', 'bounced')
      GROUP BY b.category
      ORDER BY COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) DESC
    `) as Array<Record<string, unknown>>

    // 업종별 비율 계산
    const categoryInsights = categoryStats.map((row: Record<string, unknown>) => {
      const sent = Number(row.total_sent) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      return {
        category: row.category || '미분류',
        sent,
        opened,
        clicked,
        replied,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
        clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
        replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
        grade: replied > 0 ? 'S' : clicked > 0 ? 'A' : opened > 0 ? 'B' : 'C',
      }
    })

    // 2. 템플릿별 성과 (어떤 제목/내용이 효과적인지)
    const templateStats = await prisma.$queryRawUnsafe(`
      SELECT
        t.id, t.name, t.subject, t.step, t."abVariant",
        COUNT(DISTINCT e.id) as total_sent,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) as opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) as clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) as replied
      FROM "EmailSend" e
      JOIN "EmailTemplate" t ON e."templateId" = t.id
      WHERE e.status IN ('sent', 'delivered')
      GROUP BY t.id, t.name, t.subject, t.step, t."abVariant"
      ORDER BY COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) DESC
    `) as Array<Record<string, unknown>>

    const templateInsights = templateStats.map((row: Record<string, unknown>) => {
      const sent = Number(row.total_sent) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      return {
        id: row.id,
        name: row.name,
        subject: row.subject,
        step: row.step,
        abVariant: row.abVariant,
        sent,
        opened,
        clicked,
        replied,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
        clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
        replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
      }
    })

    // 3. 단계별 성과 (1차 vs 2차 vs 3차 vs 4차 어디가 효과적인지)
    const stepStats = await prisma.$queryRawUnsafe(`
      SELECT
        e.step,
        COUNT(DISTINCT e.id) as total_sent,
        COUNT(DISTINCT CASE WHEN e."openedAt" IS NOT NULL THEN e.id END) as opened,
        COUNT(DISTINCT CASE WHEN e."clickedAt" IS NOT NULL THEN e.id END) as clicked,
        COUNT(DISTINCT CASE WHEN e."repliedAt" IS NOT NULL THEN e.id END) as replied
      FROM "EmailSend" e
      WHERE e.status IN ('sent', 'delivered')
      GROUP BY e.step
      ORDER BY e.step
    `) as Array<Record<string, unknown>>

    const stepInsights = stepStats.map((row: Record<string, unknown>) => {
      const sent = Number(row.total_sent) || 0
      const opened = Number(row.opened) || 0
      const clicked = Number(row.clicked) || 0
      const replied = Number(row.replied) || 0
      return {
        step: Number(row.step),
        stepLabel: `${row.step}차 발송`,
        sent,
        opened,
        clicked,
        replied,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
        clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
        replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
      }
    })

    // 4. 전체 요약
    const totalSends = await prisma.emailSend.count({
      where: { status: { in: ['sent', 'delivered'] } },
    })
    const totalOpened = await prisma.emailSend.count({
      where: { openedAt: { not: null } },
    })
    const totalClicked = await prisma.emailSend.count({
      where: { clickedAt: { not: null } },
    })
    const totalReplied = await prisma.emailSend.count({
      where: { repliedAt: { not: null } },
    })

    // 5. 추천 (데이터 기반)
    const recommendations = []

    // 가장 반응 좋은 업종 추천
    if (categoryInsights.length > 0) {
      const bestCategory = categoryInsights[0]
      recommendations.push({
        type: 'best_category',
        title: `가장 반응 좋은 업종: ${bestCategory.category}`,
        detail: `열람률 ${bestCategory.openRate}%, 클릭률 ${bestCategory.clickRate}%`,
      })
    }

    // 가장 효과적인 템플릿 추천
    if (templateInsights.length > 0) {
      const bestTemplate = templateInsights[0]
      recommendations.push({
        type: 'best_template',
        title: `가장 효과적인 템플릿: ${bestTemplate.name}`,
        detail: `열람률 ${bestTemplate.openRate}%, 제목: ${bestTemplate.subject}`,
      })
    }

    // 데이터 없으면 기본 추천
    if (totalSends === 0) {
      recommendations.push(
        {
          type: 'tip',
          title: '아직 발송 데이터가 없습니다',
          detail: '이메일을 발송하면 여기서 업종별/템플릿별 성과를 분석할 수 있습니다',
        },
        {
          type: 'tip',
          title: '참고: 일반적으로 반응이 좋은 업종',
          detail: '치과, 병원, 학원 등 전문 서비스 업종이 열람률이 높습니다',
        },
        {
          type: 'tip',
          title: '이메일 제목 팁',
          detail: '"마지막 안내" 스타일이 가장 클릭률이 높고 (3%), "호기심 자극"이 그 다음 (1.9%)',
        },
      )
    }

    return NextResponse.json({
      summary: {
        totalSends,
        totalOpened,
        totalClicked,
        totalReplied,
        overallOpenRate: totalSends > 0 ? ((totalOpened / totalSends) * 100).toFixed(1) : '0',
        overallClickRate: totalSends > 0 ? ((totalClicked / totalSends) * 100).toFixed(1) : '0',
        overallReplyRate: totalSends > 0 ? ((totalReplied / totalSends) * 100).toFixed(1) : '0',
      },
      categoryInsights,
      templateInsights,
      stepInsights,
      recommendations,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '인사이트 조회 실패', detail: String(error) },
      { status: 500 }
    )
  }
}
