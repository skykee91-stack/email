import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, getTenantFilter, getWriteTenantId } from '@/lib/tenant'

export async function GET() {
  const tenantFilter = await getTenantFilter()
  const templates = await prisma.emailTemplate.findMany({
    where: tenantFilter,
    orderBy: { step: 'asc' },
  })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !body.subject || !body.htmlBody) {
    return NextResponse.json({ error: '이름, 제목, 본문은 필수입니다' }, { status: 400 })
  }
  const tenantId = await getWriteTenantId()
  const template = await prisma.emailTemplate.create({
    data: {
      tenantId: tenantId ?? undefined,
      name: body.name,
      step: body.step || 1,
      subject: body.subject,
      htmlBody: body.htmlBody,
      textBody: body.textBody || null,
      category: body.category || null,
      abVariant: body.abVariant || null,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json({ template }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })
  // 고객은 자기 tenant 템플릿만 수정 가능
  const ctx = await getTenantContext()
  const existing = await prisma.emailTemplate.findUnique({ where: { id: body.id } })
  if (!existing) return NextResponse.json({ error: '템플릿 없음' }, { status: 404 })
  if (ctx && !ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  const template = await prisma.emailTemplate.update({
    where: { id: body.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.step && { step: body.step }),
      ...(body.subject && { subject: body.subject }),
      ...(body.htmlBody && { htmlBody: body.htmlBody }),
      ...(body.textBody !== undefined && { textBody: body.textBody }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.abVariant !== undefined && { abVariant: body.abVariant }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })
  return NextResponse.json({ template })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })
  const ctx = await getTenantContext()
  const existing = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: '템플릿 없음' }, { status: 404 })
  if (ctx && !ctx.isAdmin && existing.tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  await prisma.emailTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
