import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/businesses/export?category=입주청소 → CSV 다운로드
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || undefined
    const region = searchParams.get('region') || undefined

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (region) where.region = { contains: region }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // CSV 생성
    const headers = '업체명,전화번호,이메일,주소,업종,지역,블로그,홈페이지,상태'
    const rows = businesses.map(b => 
      [b.name, b.phone || '', b.email || '', b.address || '', b.category || '', b.region || '', b.blogUrl || '', b.homepageUrl || '', b.status]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = '\uFEFF' + headers + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="businesses_${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
