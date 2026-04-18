// 캠페인 CRUD
// - GET: 본인 테넌트 캠페인 목록 (어드민은 tenantId 쿼리로 특정 테넌트 선택)
// - POST: 캠페인 생성
// - PUT: 상태/이름 수정
// - DELETE: 삭제 (발송된 send 가 있으면 허용 X)

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, requireAuth } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    const { searchParams } = new URL(req.url)
    const tenantIdParam = searchParams.get('tenantId')

    let where: { tenantId?: string } = {}
    if (ctx.isAdmin) {
      if (tenantIdParam) where = { tenantId: tenantIdParam }
    } else if (ctx.tenantId) {
      where = { tenantId: ctx.tenantId }
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { companyName: true } },
        _count: { select: { emailSends: true } },
      },
    })
    return NextResponse.json({ campaigns })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    const body = await req.json()
    const { name, targetTotal, description, targetCategory, targetRegion, tenantId: tenantIdParam } = body

    if (!name || !targetTotal) {
      return NextResponse.json(
        { error: 'name, targetTotal 필수' },
        { status: 400 }
      )
    }
    if (targetTotal < 1) {
      return NextResponse.json({ error: 'targetTotal 은 1 이상' }, { status: 400 })
    }

    // 고객은 본인 테넌트 강제, 어드민은 tenantId 지정 가능
    const tenantId = ctx.isAdmin && tenantIdParam ? tenantIdParam : ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: '테넌트 없음' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name,
        description: description || null,
        targetTotal,
        targetCategory: targetCategory || null,
        targetRegion: targetRegion || null,
      },
    })
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })

    const existing = await prisma.campaign.findUnique({ where: { id: body.id } })
    if (!existing) return NextResponse.json({ error: '캠페인 없음' }, { status: 404 })

    // 권한: 어드민이거나 본인 테넌트 소유
    if (!ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const campaign = await prisma.campaign.update({
      where: { id: body.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.targetTotal && { targetTotal: body.targetTotal }),
        ...(body.targetCategory !== undefined && { targetCategory: body.targetCategory }),
        ...(body.targetRegion !== undefined && { targetRegion: body.targetRegion }),
        ...(body.status === 'completed' && { finishedAt: new Date() }),
      },
    })
    return NextResponse.json({ campaign })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })

    const existing = await prisma.campaign.findUnique({
      where: { id },
      include: { _count: { select: { emailSends: true } } },
    })
    if (!existing) return NextResponse.json({ error: '캠페인 없음' }, { status: 404 })

    if (!ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 발송된 send 가 있으면 삭제 방지 (이력 보존)
    if (existing._count.emailSends > 0) {
      return NextResponse.json(
        {
          error: `발송 이력이 있는 캠페인은 삭제할 수 없어요 (${existing._count.emailSends}건). 상태를 'completed' 로 바꾸세요.`,
        },
        { status: 400 }
      )
    }

    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
