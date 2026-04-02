import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { calculateLeadScore } from '@/lib/leads/scorer'

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    const messageId = event['message-id'] || event.messageId

    if (!messageId) return NextResponse.json({ error: 'no message-id' }, { status: 400 })

    const send = await prisma.emailSend.findFirst({ where: { brevoMessageId: messageId } })
    if (!send) return NextResponse.json({ ok: true, note: 'send not found' })

    switch (event.event) {
      case 'delivered':
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { status: 'delivered', deliveredAt: new Date(event.date || Date.now()) },
        })
        break

      case 'opened':
      case 'open':
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { openedAt: send.openedAt || new Date(), openCount: { increment: 1 } },
        })
        await calculateLeadScore(send.businessId)
        break

      case 'click':
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { clickedAt: send.clickedAt || new Date(), clickCount: { increment: 1 } },
        })
        await calculateLeadScore(send.businessId)
        break

      case 'hard_bounce':
      case 'soft_bounce':
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { status: 'bounced', bouncedAt: new Date(), bounceReason: event.reason || event.event },
        })
        await prisma.business.update({ where: { id: send.businessId }, data: { status: 'bounced' } })
        break

      case 'unsubscribe':
      case 'spam': {
        const biz = await prisma.business.findUnique({ where: { id: send.businessId } })
        if (biz?.email) {
          await prisma.unsubscribe.upsert({
            where: { email: biz.email },
            update: {},
            create: { email: biz.email, businessId: biz.id, reason: event.event },
          })
          await prisma.business.update({ where: { id: biz.id }, data: { status: 'unsubscribed' } })
        }
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
