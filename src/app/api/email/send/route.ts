import { sendBulkEmails } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.templateId) return NextResponse.json({ error: 'templateId 필수' }, { status: 400 })

    // dryRun이면 즉시 응답, 실제 발송이면 백그라운드 실행
    const isDryRun = body.dryRun || false

    if (isDryRun) {
      const result = await sendBulkEmails({
        templateId: body.templateId,
        templateIdB: body.templateIdB || undefined,
        step: body.step || 1,
        filters: body.filters || {},
        maxCount: body.maxCount || 100,
        dryRun: true,
        profileId: body.profileId || undefined,
        delaySeconds: body.delaySeconds ?? 5,
      })
      return NextResponse.json(result)
    }

    // 실제 발송: 백그라운드에서 실행 (응답은 즉시 반환)
    sendBulkEmails({
      templateId: body.templateId,
      templateIdB: body.templateIdB || undefined,
      step: body.step || 1,
      filters: body.filters || {},
      maxCount: body.maxCount || 100,
      dryRun: false,
      profileId: body.profileId || undefined,
      delaySeconds: body.delaySeconds ?? 5,
    }).catch(e => console.error('대량 발송 오류:', e))

    return NextResponse.json({
      ok: true,
      message: `${body.maxCount || 100}건 백그라운드 발송 시작 (간격: ${body.delaySeconds ?? 5}초)`,
      backgrounded: true,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
