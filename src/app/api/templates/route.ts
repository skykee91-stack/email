import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { step: 'asc' } })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !body.subject || !body.htmlBody) {
    return NextResponse.json({ error: '이름, 제목, 본문은 필수입니다' }, { status: 400 })
  }
  const template = await prisma.emailTemplate.create({
    data: {
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
  await prisma.emailTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
