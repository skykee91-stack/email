import { NextRequest, NextResponse } from 'next/server'
import { getRelatedKeywords, KeywordResult } from '@/lib/naver-ads'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '검색어를 입력하세요' }, { status: 400 })
    }

    // 네이버 광고 API로 관련 키워드 조회
    const results = await getRelatedKeywords(query)

    // 관련성 점수 계산 + 필터링
    const queryLower = query.replace(/\s+/g, '').toLowerCase()
    const scored = results
      .map((r: KeywordResult) => {
        const kwLower = r.keyword.toLowerCase()
        let relevance = 0
        // 원래 키워드 포함 시 +3
        if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) relevance += 3
        // 검색량 있으면 +1
        if (r.totalSearches > 0) relevance += 1
        return { ...r, relevance }
      })
      // 검색량 0 제외
      .filter((r) => r.totalSearches > 0)
      // 관련성 높은 순 → 검색량 높은 순
      .sort((a, b) => b.relevance - a.relevance || b.totalSearches - a.totalSearches)
      // 상위 15개
      .slice(0, 15)

    return NextResponse.json({
      query,
      keywords: scored,
      total: scored.length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
