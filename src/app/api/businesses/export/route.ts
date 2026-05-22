import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/businesses/export → 업체 CSV 다운로드
// 쿼리: category, region, from (YYYY-MM-DD — KST 기준 해당 날짜 00:00 이후 수집분만)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || undefined
    const region = searchParams.get('region') || undefined
    const from = searchParams.get('from') || undefined

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (region) where.region = { contains: region }
    if (from) {
      // KST 00:00 기준 — Asia/Seoul 은 UTC+9 이므로 ISO 에 +09:00 붙여서 파싱
      const fromDate = new Date(`${from}T00:00:00+09:00`)
      if (!isNaN(fromDate.getTime())) {
        where.createdAt = { gte: fromDate }
      }
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // KST 기준 "YYYY-MM-DD HH:mm" 포맷 (엑셀 날짜 필터에 바로 인식됨)
    const fmt = (d: Date) => d.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)

    const headers = '수집일시,업체명,전화번호,이메일,주소,업종,지역,블로그,홈페이지,상태'
    const rows = businesses.map(b =>
      [
        fmt(b.createdAt),
        b.name,
        b.phone || '',
        b.email || '',
        b.address || '',
        b.category || '',
        b.region || '',
        b.blogUrl || '',
        b.homepageUrl || '',
        b.status,
      ]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = '\uFEFF' + headers + '\n' + rows.join('\n')

    const today = new Date().toISOString().slice(0, 10)
    const dateLabel = from ? `_from-${from}` : ''
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="businesses${dateLabel}_${today}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
