// 업체 목록 API
// GET /api/businesses → 업체 목록 조회 (필터: 지역, 업종, 상태)
// POST /api/businesses → 업체 추가

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // 필터 파라미터 가져오기
    const category = searchParams.get('category')    // 업종 필터
    const region = searchParams.get('region')        // 지역 필터
    const status = searchParams.get('status')        // 상태 필터
    const search = searchParams.get('search')        // 검색어 (업체명)
    const hasEmail = searchParams.get('hasEmail')    // 이메일 있는 것만
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 필터 조건 만들기
    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (region) where.region = { contains: region }
    if (status) where.status = status
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (hasEmail === 'true') where.email = { not: null }

    // DB에서 업체 목록 조회
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.business.count({ where }),
    ])

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: '업체 목록 조회 실패', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 필수값 체크
    if (!body.name) {
      return NextResponse.json(
        { error: '업체명은 필수입니다' },
        { status: 400 }
      )
    }

    // 중복 체크 (placeId가 있으면)
    if (body.placeId) {
      const existing = await prisma.business.findUnique({
        where: { placeId: body.placeId },
      })
      if (existing) {
        return NextResponse.json(
          { error: '이미 등록된 업체입니다', business: existing },
          { status: 409 }
        )
      }
    }

    // 업체 생성
    const business = await prisma.business.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        personalPhone: body.personalPhone || null,
        email: body.email || null,
        naverId: body.naverId || null,
        address: body.address || null,
        category: body.category || null,
        region: body.region || null,
        blogUrl: body.blogUrl || null,
        homepageUrl: body.homepageUrl || null,
        placeId: body.placeId || null,
      },
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '업체 등록 실패', detail: String(error) },
      { status: 500 }
    )
  }
}
