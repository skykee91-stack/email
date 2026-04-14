// 이메일 통계 공통 집계 함수
// 모든 통계 API(funnel/insights/daily/roi)가 이 함수를 써서 같은 정의로 숫자를 계산한다.
//
// 정의
// - sent      = 실제로 쏜 메일: status IN ('sent','delivered','bounced')
// - delivered = 도달: status = 'delivered'
// - opened    = 열람: openedAt IS NOT NULL
// - clicked   = 클릭: clickedAt IS NOT NULL
// - bounced   = 실패: status = 'bounced'
// - replied   = 답장: repliedAt IS NOT NULL
//
// 비율 공식 (업계 표준)
// - deliveryRate = delivered / sent
// - openRate     = opened    / delivered
// - clickRate    = clicked   / delivered
// - bounceRate   = bounced   / sent
// - replyRate    = replied   / delivered

import { prisma } from '@/lib/prisma'

export interface EmailMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  replied: number
  unsubscribed: number
}

export interface EmailMetricsWithRates extends EmailMetrics {
  rates: {
    deliveryRate: number
    openRate: number
    clickRate: number
    bounceRate: number
    replyRate: number
  }
}

export interface DateRange {
  gte: Date
  lte?: Date
}

export function getDateRangeFromDays(days: number): DateRange {
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { gte: start }
}

const SENT_STATUSES = ['sent', 'delivered', 'bounced'] as const

function pct(numer: number, denom: number): number {
  if (denom <= 0) return 0
  return Number(((numer / denom) * 100).toFixed(1))
}

/**
 * 지정 기간의 이메일 지표를 계산한다.
 * 기간 필터는 createdAt 기준 (EmailSend 레코드가 만들어진 시점).
 */
export async function getEmailMetrics(
  range: DateRange,
): Promise<EmailMetricsWithRates> {
  const base = { createdAt: range }

  const [sent, delivered, opened, clicked, bounced, replied, unsubscribed] =
    await Promise.all([
      prisma.emailSend.count({
        where: { ...base, status: { in: [...SENT_STATUSES] } },
      }),
      prisma.emailSend.count({
        where: { ...base, status: 'delivered' },
      }),
      prisma.emailSend.count({
        where: { ...base, openedAt: { not: null } },
      }),
      prisma.emailSend.count({
        where: { ...base, clickedAt: { not: null } },
      }),
      prisma.emailSend.count({
        where: { ...base, status: 'bounced' },
      }),
      prisma.emailSend.count({
        where: { ...base, repliedAt: { not: null } },
      }),
      prisma.unsubscribe.count({
        where: { unsubscribedAt: range },
      }),
    ])

  return {
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    replied,
    unsubscribed,
    rates: {
      deliveryRate: pct(delivered, sent),
      openRate: pct(opened, delivered),
      clickRate: pct(clicked, delivered),
      bounceRate: pct(bounced, sent),
      replyRate: pct(replied, delivered),
    },
  }
}

/**
 * EmailSend where 절에서 "발송된 메일만" 필터링할 때 쓰는 공통 조건.
 * insights 카테고리/템플릿/단계별 집계에서 사용.
 */
export const SENT_STATUS_FILTER = { in: [...SENT_STATUSES] }
