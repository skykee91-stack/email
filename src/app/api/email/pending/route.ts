import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 브랜드별 타겟 업종 키워드 (업체 카테고리에 이 단어가 포함되면 해당 브랜드 타겟)
// 셀포는 전 업종이라 빈 배열 (= 필터 안 함)
const BRAND_TARGET_KEYWORDS: Record<string, string[]> = {
  '셀포': [], // 전 업종 OK
  '피원코팅즈': [
    // 단일 글자 '카' 는 '키즈카페'·'고양이카페' 등에 잘못 매치되어 제거
    '자동차', '차량', '랩핑', '바이크', '자전거', '오토바이',
    '판금', '도장', '튜닝', '디테일', 'PPF', '광택', '폴리싱', '세차', '모터스',
    '타이어', '정비', '카센터', '공업사',
  ],
}

function isTargetCategory(brand: string, category: string | null): boolean {
  const keywords = BRAND_TARGET_KEYWORDS[brand]
  if (!keywords || keywords.length === 0) return true // 전 업종 타겟
  if (!category) return false
  return keywords.some(k => category.toLowerCase().includes(k.toLowerCase()))
}

// 템플릿 브랜드(카테고리)별 미발송 업체 현황
// 셀포: 전 업종 타겟
// 피원코팅즈: 자동차/랩핑/바이크 관련 업종만
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

      // 브랜드 타겟 업종만 필터링
      const targetUnsent = unsent.filter(b => isTargetCategory(brand, b.category))

      // 업종별 그룹핑
      const byCategory: Record<string, number> = {}
      for (const b of targetUnsent) {
        const cat = b.category || '미분류'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      }

      unsent1ByBrand.push({
        brand,
        total: targetUnsent.length,
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

      // 브랜드 타겟 업종만 필터링
      const targetPending = pending.filter(s => isTargetCategory(brand, s.business.category))

      const byCategory: Record<string, number> = {}
      for (const s of targetPending) {
        const cat = s.business.category || '미분류'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      }

      pending2ByBrand.push({
        brand,
        total: targetPending.length,
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
