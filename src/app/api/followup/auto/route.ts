// 팔로업 자동 실행 API
// POST /api/followup/auto → 2차, 3차, 4차 팔로업을 한번에 자동 실행
// - 공유 큐(send-queue)를 사용해 일반 발송과 순차 실행 보장
// - delaySeconds 파라미터로 발송 간격 제어 (기본 5초)
// - 실제 발송은 백그라운드에서 돌고, POST는 즉시 응답
//
// 각 단계별 조건:
//   2차: 1차 발송 후 3일 경과 + 답장 없음
//   3차: 1차 발송 후 7일 경과 + 2차 발송 완료 + 답장 없음
//   4차: 1차 발송 후 14일 경과 + 3차 발송 완료 + 답장 없음

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { enqueueSendJob } from '@/lib/email/send-queue'
import {
  runFollowupAuto,
  scanFollowupCandidates,
} from '@/lib/email/followup-runner'

const FOLLOWUP_SCHEDULE = [
  { step: 2, delayDays: 3, prevStep: 1 },
  { step: 3, delayDays: 7, prevStep: 2 },
  { step: 4, delayDays: 14, prevStep: 3 },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun || false
    const delaySeconds = (body.delaySeconds as number) ?? 5

    // 드라이런은 동기 실행 (큐 거치지 않음)
    if (dryRun) {
      return NextResponse.json(await runDryRun())
    }

    // 실제 실행: 대상 수 먼저 스캔 (totalTargets 세팅용)
    const overview = await scanFollowupCandidates()

    if (overview.totalCandidates === 0) {
      return NextResponse.json({
        ok: true,
        dryRun: false,
        summary: {
          totalCandidates: 0,
          totalSent: 0,
          message: '팔로업 대상이 없습니다',
        },
      })
    }

    // 공유 큐에 등록
    const { queued, position, job } = enqueueSendJob({
      jobInfo: {
        kind: 'followup',
        templateName: '팔로업 자동 (2~4차)',
        category: overview.steps
          .map((s) => `${s.step}차 ${s.brands.reduce((n, b) => n + b.candidates, 0)}건`)
          .join(', '),
        totalTargets: overview.totalCandidates,
      },
      runner: (update) => runFollowupAuto(update, delaySeconds * 1000),
    })

    return NextResponse.json({
      ok: true,
      dryRun: false,
      queued,
      position,
      backgrounded: true,
      summary: {
        totalCandidates: overview.totalCandidates,
        message: queued
          ? `팔로업 대기열 추가 (${position}번째). 현재 발송 완료 후 자동 시작.`
          : `팔로업 ${overview.totalCandidates}건 백그라운드 발송 시작 (간격: ${delaySeconds}초)`,
      },
      job,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '팔로업 자동 실행 실패', detail: String(error) },
      { status: 500 },
    )
  }
}

// 드라이런 — 기존과 동일한 응답 구조 유지
async function runDryRun() {
  const templates = await prisma.emailTemplate.findMany({
    where: { isActive: true },
    orderBy: { step: 'asc' },
  })

  const templateMap: Record<string, Record<number, string>> = {}
  for (const t of templates) {
    const cat = t.category || 'default'
    if (!templateMap[cat]) templateMap[cat] = {}
    if (!templateMap[cat][t.step]) templateMap[cat][t.step] = t.id
  }

  const allResults: Array<{
    step: number
    category: string
    candidates: number
    sent: number
    skipped: number
    templateName?: string
    targets?: Array<{ name: string; email: string; businessCategory: string }>
  }> = []

  for (const schedule of FOLLOWUP_SCHEDULE) {
    const { step, delayDays, prevStep } = schedule
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - delayDays)

    const allBrands = Object.keys(templateMap)
    for (const brand of allBrands) {
      if (!templateMap[brand]?.[prevStep]) continue

      const candidates = await prisma.emailSend.findMany({
        where: {
          step: prevStep,
          status: { in: ['sent', 'delivered'] },
          sentAt: { lte: targetDate },
          repliedAt: null,
          template: { category: brand },
          business: {
            status: 'active',
            emailSends: {
              none: {
                step,
                template: { category: brand },
              },
            },
          },
        },
        include: {
          business: { select: { name: true, email: true, category: true } },
        },
        take: 200,
      })

      if (candidates.length === 0) continue

      const templateId = templateMap[brand]?.[step]
      const templateName = templates.find((t) => t.id === templateId)?.name || '없음'

      allResults.push({
        step,
        category: brand,
        candidates: candidates.length,
        sent: 0,
        skipped: 0,
        templateName,
        targets: candidates.map((c) => ({
          name: c.business.name,
          email: c.business.email || '',
          businessCategory: c.business.category || '',
        })),
      })
    }
  }

  const totalCandidates = allResults.reduce((s, r) => s + r.candidates, 0)

  return {
    dryRun: true,
    summary: {
      totalCandidates,
      totalSent: 0,
      message: `팔로업 대상 ${totalCandidates}명 (드라이런)`,
    },
    steps: allResults,
  }
}

// GET: 팔로업 현황 요약 (카테고리별) — 기존 로직 유지
export async function GET() {
  try {
    const results = []

    for (const schedule of FOLLOWUP_SCHEDULE) {
      const { step, delayDays, prevStep } = schedule
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - delayDays)

      const templates = await prisma.emailTemplate.findMany({
        where: { isActive: true, category: { not: null } },
        select: { category: true },
      })
      const brands = Array.from(
        new Set(templates.map((t) => t.category!)),
      ).filter(Boolean)

      const byCategory: Record<
        string,
        { count: number; businessCategories: Record<string, number> }
      > = {}
      let totalCandidates = 0

      for (const brand of brands) {
        const candidates = await prisma.emailSend.findMany({
          where: {
            step: prevStep,
            status: { in: ['sent', 'delivered'] },
            sentAt: { lte: targetDate },
            repliedAt: null,
            template: { category: brand },
            business: {
              status: 'active',
              emailSends: {
                none: {
                  step,
                  template: { category: brand },
                },
              },
            },
          },
          include: {
            business: { select: { category: true } },
          },
        })

        if (candidates.length > 0) {
          byCategory[brand] = { count: candidates.length, businessCategories: {} }
          totalCandidates += candidates.length
          for (const c of candidates) {
            const bizCat = c.business.category || '미분류'
            byCategory[brand].businessCategories[bizCat] =
              (byCategory[brand].businessCategories[bizCat] || 0) + 1
          }
        }
      }

      const alreadySent = await prisma.emailSend.count({ where: { step } })

      results.push({
        step,
        label: `${step}차 팔로업`,
        delayDays,
        pendingCount: totalCandidates,
        sentCount: alreadySent,
        description: `1차 발송 ${delayDays}일 후 자동 발송`,
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          count: data.count,
          businessCategories: Object.entries(data.businessCategories)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        })),
      })
    }

    const firstSent = await prisma.emailSend.count({ where: { step: 1 } })
    const totalReplied = await prisma.emailSend.count({
      where: { repliedAt: { not: null } },
    })

    return NextResponse.json({
      firstSent,
      totalReplied,
      steps: results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
