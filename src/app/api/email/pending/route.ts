import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 템플릿 브랜드(카테고리)별 미발송 업체 현황
// 셀포: 전 업종 타겟 (모든 업체 대상, 단 셀포로 1차 안 보낸 애들)
// 피원코팅즈: 자동차/랩핑/바이크 관련 업종만 (단 피원으로 1차 안 보낸 애들)
export async function GET() {
  try {
    // 모든 활성 템플릿 카테고리 조회
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true, step: true },
    })
    const brands = Array.from(new Set(templates.map(t => t.category!))).filter(Boolean)

    // 브랜드별 1차 미발송 집계
    const unsent1ByBrand: Array<{ brand: string; total: number; byCategory: { category: string; count: number }[] }> = []

    for (const brand of brands) {
      // 해당 브랜드로 1차를 보낸 적 없는 active 업체
      const unsent = await prisma.business.findMany({
        where: {
          status: 'active',
          email: { not: null },
          emailSends: {
            none: {
              step: 1,
              template: { category: brand },
            },
          },
        },
        select: { category: true },
      })

      // 업종별 그룹핑
      const byCategory: Record<string, number> = {}
      for (const b of unsent) {
        const cat = b.category || '미분류'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      }

      unsent1ByBrand.push({
        brand,
        total: unsent.length,
        byCategory: Object.entries(byCategory)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      })
    }

    // 2차 대기: 브랜드별로 1차 발송 후 3일 경과 + 답장 없음 + 같은 브랜드 2차 미발송
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const pending2ByBrand: Array<{ brand: string; total: number; byCategory: { category: string; count: number }[] }> = []

    for (const brand of brands) {
      const pending = await prisma.emailSend.findMany({
        where: {
          step: 1,
          status: { in: ['sent', 'delivered'] },
          sentAt: { lte: threeDaysAgo },
          repliedAt: null,
          template: { category: brand },
          business: {
            status: 'active',
            emailSends: {
              none: {
                step: 2,
                template: { category: brand },
              },
            },
          },
        },
        include: { business: { select: { category: true } } },
      })

      const byCategory: Record<string, number> = {}
      for (const s of pending) {
        const cat = s.business.category || '미분류'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      }

      pending2ByBrand.push({
        brand,
        total: pending.length,
        byCategory: Object.entries(byCategory)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      })
    }

    // 전체 합계 (기존 API 호환 + 브랜드별)
    const totalUnsent1 = unsent1ByBrand.reduce((s, b) => s + b.total, 0)
    const totalPending2 = pending2ByBrand.reduce((s, b) => s + b.total, 0)

    return NextResponse.json({
      unsent1: {
        total: totalUnsent1,
        byBrand: unsent1ByBrand,
      },
      pending2: {
        total: totalPending2,
        byBrand: pending2ByBrand,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
