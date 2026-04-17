// 발신자 프로필 CRUD API
// GET  → 목록 조회
// POST → 새 프로필 추가

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, getTenantFilter, getWriteTenantId } from '@/lib/tenant'

export async function GET() {
  const tenantFilter = await getTenantFilter()
  const profiles = await prisma.senderProfile.findMany({
    where: tenantFilter,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ profiles })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.serviceName || !body.senderEmail) {
      return NextResponse.json(
        { error: '서비스명과 발신 이메일은 필수입니다' },
        { status: 400 }
      )
    }

    const tenantId = await getWriteTenantId()
    const ctx = await getTenantContext()

    // 기본 프로필로 설정 시 같은 테넌트 내 다른 것들 해제
    if (body.isDefault) {
      await prisma.senderProfile.updateMany({
        where: ctx?.isAdmin ? {} : { tenantId: tenantId ?? undefined },
        data: { isDefault: false },
      })
    }

    const profile = await prisma.senderProfile.create({
      data: {
        tenantId: tenantId ?? undefined,
        serviceName: body.serviceName,
        senderName: body.senderName || body.serviceName,
        senderEmail: body.senderEmail,
        companyName: body.companyName || '',
        representative: body.representative || null,
        address: body.address || null,
        phone: body.phone || null,
        businessNumber: body.businessNumber || null,
        isDefault: body.isDefault || false,
      },
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '프로필 생성 실패', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id 필수' }, { status: 400 })
    }

    const ctx = await getTenantContext()
    const existing = await prisma.senderProfile.findUnique({ where: { id: body.id } })
    if (!existing) return NextResponse.json({ error: '프로필 없음' }, { status: 404 })
    if (ctx && !ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    if (body.isDefault) {
      await prisma.senderProfile.updateMany({
        where: ctx?.isAdmin ? {} : { tenantId: existing.tenantId },
        data: { isDefault: false },
      })
    }

    const profile = await prisma.senderProfile.update({
      where: { id: body.id },
      data: {
        ...(body.serviceName && { serviceName: body.serviceName }),
        ...(body.senderName && { senderName: body.senderName }),
        ...(body.senderEmail && { senderEmail: body.senderEmail }),
        ...(body.companyName && { companyName: body.companyName }),
        ...(body.representative !== undefined && { representative: body.representative }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.businessNumber !== undefined && { businessNumber: body.businessNumber }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json(
      { error: '프로필 수정 실패', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })

    const ctx = await getTenantContext()
    const existing = await prisma.senderProfile.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: '프로필 없음' }, { status: 404 })
    if (ctx && !ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    await prisma.senderProfile.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: '프로필 삭제 실패', detail: String(error) },
      { status: 500 }
    )
  }
}
