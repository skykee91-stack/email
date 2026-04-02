import { sendBulkEmails } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.templateId) return NextResponse.json({ error: 'templateId 필수' }, { status: 400 })

    const result = await sendBulkEmails({
      templateId: body.templateId,
      step: body.step || 1,
      filters: body.filters || {},
      maxCount: body.maxCount || 100,
      dryRun: body.dryRun || false,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
