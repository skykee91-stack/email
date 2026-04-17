// 어드민 전용 — 테넌트(고객 계정) CRUD
// 고객 생성 시 User 도 같이 생성 (트랜잭션)

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/tenant'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof Response) return e
    throw e
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, email: true, name: true, role: true, lastLoginAt: true } },
      _count: { select: { emailSends: true, emailTemplates: true, hotLeads: true } },
    },
  })
  return NextResponse.json({ tenants })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof Response) return e
    throw e
  }

  const body = await req.json()
  const {
    companyName,
    domain,
    senderEmail,
    senderName,
    forwardTo,
    plan = 'BASIC',
    sendQuotaMonthly,
    customerEmail,
    customerName,
    customerPassword,
  } = body

  if (!companyName || !customerEmail || !customerPassword || !customerName) {
    return NextResponse.json(
      { error: 'companyName, customerEmail, customerPassword, customerName 필수' },
      { status: 400 }
    )
  }

  // 이메일 중복 체크
  const existingUser = await prisma.user.findUnique({ where: { email: customerEmail } })
  if (existingUser) {
    return NextResponse.json({ error: '이미 사용 중인 이메일' }, { status: 409 })
  }

  const quotaByPlan: Record<string, number> = {
    BASIC: 2000,
    STANDARD: 8000,
    PREMIUM: 20000,
  }
  const finalQuota = sendQuotaMonthly ?? quotaByPlan[plan] ?? 2000

  const passwordHash = await bcrypt.hash(customerPassword, 10)

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        companyName,
        domain: domain || null,
        senderEmail: senderEmail || null,
        senderName: senderName || companyName,
        forwardTo: forwardTo || customerEmail,
        plan,
        sendQuotaMonthly: finalQuota,
        setupStatus: 'PENDING',
      },
    })
    const user = await tx.user.create({
      data: {
        email: customerEmail,
        passwordHash,
        name: customerName,
        role: 'CUSTOMER',
        tenantId: tenant.id,
      },
    })
    return { tenant, user }
  })

  return NextResponse.json(
    {
      tenant: result.tenant,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
    },
    { status: 201 }
  )
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof Response) return e
    throw e
  }

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })

  const tenant = await prisma.tenant.update({
    where: { id: body.id },
    data: {
      ...(body.companyName && { companyName: body.companyName }),
      ...(body.domain !== undefined && { domain: body.domain }),
      ...(body.senderEmail !== undefined && { senderEmail: body.senderEmail }),
      ...(body.senderName && { senderName: body.senderName }),
      ...(body.forwardTo !== undefined && { forwardTo: body.forwardTo }),
      ...(body.plan && { plan: body.plan }),
      ...(body.sendQuotaMonthly !== undefined && { sendQuotaMonthly: body.sendQuotaMonthly }),
      ...(body.setupStatus && { setupStatus: body.setupStatus }),
      ...(body.brevoSenderId !== undefined && { brevoSenderId: body.brevoSenderId }),
    },
  })

  return NextResponse.json({ tenant })
}
