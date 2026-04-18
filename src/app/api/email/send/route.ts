import { sendBulkEmails } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'
import { enqueueSendJob, getSendStateLive } from '@/lib/email/send-queue'
import { getWriteTenantId } from '@/lib/tenant'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.templateId)
      return NextResponse.json({ error: 'templateId 필수' }, { status: 400 })

    const tenantId = await getWriteTenantId()
    const campaignId = body.campaignId || undefined

    // dryRun이면 즉시 응답 (큐 거치지 않음)
    if (body.dryRun) {
      const result = await sendBulkEmails({
        templateId: body.templateId,
        templateIdB: body.templateIdB || undefined,
        step: body.step || 1,
        filters: body.filters || {},
        maxCount: body.maxCount || 100,
        dryRun: true,
        profileId: body.profileId || undefined,
        tenantId,
        campaignId,
        delaySeconds: body.delaySeconds ?? 5,
      })
      return NextResponse.json(result)
    }

    const templateName = body._templateName || body.templateId
    const maxCount = (body.maxCount as number) || 100
    const category = (body.filters as Record<string, string>)?.category || '전체'
    const delaySeconds = (body.delaySeconds as number) ?? 5

    // 공유 큐에 등록 (팔로업이든 일반이든 순차 실행)
    const { queued, position, job } = enqueueSendJob({
      jobInfo: {
        kind: 'bulk',
        templateName,
        category,
        totalTargets: maxCount,
      },
      runner: async (update) => {
        const result = (await sendBulkEmails({
          templateId: body.templateId as string,
          templateIdB: (body.templateIdB as string) || undefined,
          step: (body.step as number) || 1,
          filters: (body.filters as Record<string, string>) || {},
          maxCount,
          dryRun: false,
          profileId: (body.profileId as string) || undefined,
          tenantId,
          campaignId,
          delaySeconds,
          // 후보 조회 직후 실제 대상 수로 진행바 분모 갱신
          onStart: ({ totalTargets }) => update({ totalTargets }),
        })) as { sent?: number; skipped?: number }
        const sent = result.sent || 0
        const skipped = result.skipped || 0
        update({ sent, skipped })
        return { sent, skipped }
      },
    })

    if (queued) {
      return NextResponse.json({
        ok: true,
        queued: true,
        position,
        message: `발송 대기열에 추가됨 (${position}번째). 현재 발송 완료 후 자동 시작.`,
        currentJob: job,
      })
    }

    return NextResponse.json({
      ok: true,
      message: `${maxCount}건 백그라운드 발송 시작 (간격: ${delaySeconds}초)`,
      backgrounded: true,
      job,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET: 발송 상태 조회 (일반/팔로업 모두 포함)
// 진행 중인 작업의 sent/skipped는 DB에서 실시간 집계하여 반환
export async function GET() {
  return NextResponse.json(await getSendStateLive())
}
