// 대량 업체 등록 API
// POST /api/businesses/bulk → 여러 업체를 한번에 등록
// 200~300개도 빠르게 처리 가능

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// 스크래퍼 엑셀 한국어 헤더 → DB 필드 매핑
const FIELD_MAP: Record<string, string> = {
  '업체명': 'name',
  '대표전화': 'phone',
  '개인번호(010)': 'personalPhone',
  '개인번호': 'personalPhone',
  '이메일': 'email',
  '네이버아이디': 'naverId',
  '네이버 아이디': 'naverId',
  '주소': 'address',
  '카테고리': 'category',
  '업종': 'category',
  '지역': 'region',
  '블로그': 'blogUrl',
  '홈페이지': 'homepageUrl',
  'place_id': 'placeId',
}

function mapFields(raw: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    const fieldName = FIELD_MAP[key] || key
    if (value !== undefined && value !== '' && value !== '번호') {
      mapped[fieldName] = value
    }
  }
  return mapped
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawBusinesses = Array.isArray(body.businesses) ? body.businesses : (Array.isArray(body) ? body : [])
    const businesses: Array<{
      name: string
      email?: string
      phone?: string
      personalPhone?: string
      naverId?: string
      address?: string
      category?: string
      region?: string
      blogUrl?: string
      homepageUrl?: string
      placeId?: string
    }> = rawBusinesses.map(mapFields)

    if (businesses.length === 0) {
      return NextResponse.json(
        { error: 'businesses 배열이 필요합니다' },
        { status: 400 }
      )
    }

    // 기존 placeId 목록 조회 (중복 방지)
    const existingPlaceIds = new Set<string>()
    const existingEmails = new Set<string>()

    const placeIds = businesses
      .map((b) => b.placeId)
      .filter((id): id is string => !!id)
    if (placeIds.length > 0) {
      const existing = await prisma.business.findMany({
        where: { placeId: { in: placeIds } },
        select: { placeId: true },
      })
      existing.forEach((e) => {
        if (e.placeId) existingPlaceIds.add(e.placeId)
      })
    }

    const emails = businesses
      .map((b) => b.email)
      .filter((e): e is string => !!e)
    if (emails.length > 0) {
      const existing = await prisma.business.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      })
      existing.forEach((e) => {
        if (e.email) existingEmails.add(e.email)
      })
    }

    // 중복 제외하고 등록할 데이터 필터링
    const toCreate = businesses.filter((b) => {
      if (!b.name) return false
      if (b.placeId && existingPlaceIds.has(b.placeId)) return false
      if (b.email && existingEmails.has(b.email)) return false
      return true
    })

    // 배치로 나눠서 등록 (50개씩)
    const BATCH_SIZE = 50
    let totalCreated = 0

    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE)
      const result = await prisma.business.createMany({
        data: batch.map((b) => ({
          name: b.name,
          phone: b.phone || null,
          personalPhone: b.personalPhone || null,
          email: b.email || null,
          naverId: b.naverId || null,
          address: b.address || null,
          category: b.category || null,
          region: b.region || null,
          blogUrl: b.blogUrl || null,
          homepageUrl: b.homepageUrl || null,
          placeId: b.placeId || null,
        })),
        skipDuplicates: true,
      })
      totalCreated += result.count
    }

    return NextResponse.json({
      ok: true,
      total: businesses.length,
      created: totalCreated,
      skipped: businesses.length - totalCreated,
      message: `${totalCreated}건 등록, ${businesses.length - totalCreated}건 건너뜀 (중복/이름없음)`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '대량 등록 실패', detail: String(error) },
      { status: 500 }
    )
  }
}
