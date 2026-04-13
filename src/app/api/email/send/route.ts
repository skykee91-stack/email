import { sendBulkEmails } from '@/lib/email/sender'
import { NextRequest, NextResponse } from 'next/server'

// 발송 상태 추적
interface SendJob {
  id: string
  status: 'running' | 'done' | 'failed'
  templateName: string
  category: string
  totalTargets: number
  sent: number
  skipped: number
  startedAt: string
  finishedAt?: string
}

let currentSendJob: SendJob | null = null
const sendQueue: Array<{ body: Record<string, unknown>; templateName: string }> = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.templateId) return NextResponse.json({ error: 'templateId 필수' }, { status: 400 })

    // dryRun이면 즉시 응답
    if (body.dryRun) {
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

    const templateName = body._templateName || body.templateId

    // 이미 발송 중이면 큐에 추가
    if (currentSendJob?.status === 'running') {
      sendQueue.push({ body, templateName })
      return NextResponse.json({
        ok: true,
        queued: true,
        position: sendQueue.length,
        message: `발송 대기열에 추가됨 (${sendQueue.length}번째). 현재 발송 완료 후 자동 시작.`,
        currentJob: currentSendJob,
      })
    }

    // 발송 시작
    startSendJob(body, templateName)

    return NextResponse.json({
      ok: true,
      message: `${body.maxCount || 100}건 백그라운드 발송 시작 (간격: ${body.delaySeconds ?? 5}초)`,
      backgrounded: true,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

function startSendJob(body: Record<string, unknown>, templateName: string) {
  const jobId = Date.now().toString()
  currentSendJob = {
    id: jobId,
    status: 'running',
    templateName,
    category: (body.filters as Record<string, string>)?.category || '전체',
    totalTargets: (body.maxCount as number) || 100,
    sent: 0,
    skipped: 0,
    startedAt: new Date().toISOString(),
  }

  sendBulkEmails({
    templateId: body.templateId as string,
    templateIdB: (body.templateIdB as string) || undefined,
    step: (body.step as number) || 1,
    filters: (body.filters as Record<string, string>) || {},
    maxCount: (body.maxCount as number) || 100,
    dryRun: false,
    profileId: (body.profileId as string) || undefined,
    delaySeconds: (body.delaySeconds as number) ?? 5,
  }).then((result: unknown) => {
    const r = result as { sent?: number; skipped?: number }
    if (currentSendJob?.id === jobId) {
      currentSendJob.status = 'done'
      currentSendJob.sent = r.sent || 0
      currentSendJob.skipped = r.skipped || 0
      currentSendJob.finishedAt = new Date().toISOString()
    }
    // 큐에 다음 작업이 있으면 자동 시작
    processNextSendQueue()
  }).catch(e => {
    console.error('대량 발송 오류:', e)
    if (currentSendJob?.id === jobId) {
      currentSendJob.status = 'failed'
      currentSendJob.finishedAt = new Date().toISOString()
    }
    processNextSendQueue()
  })
}

function processNextSendQueue() {
  if (sendQueue.length === 0) return
  const next = sendQueue.shift()!
  startSendJob(next.body, next.templateName)
}

// GET: 발송 상태 조회
export async function GET() {
  return NextResponse.json({
    sendJob: currentSendJob,
    queue: sendQueue.map((q, i) => ({
      position: i + 1,
      templateName: q.templateName,
      category: (q.body.filters as Record<string, string>)?.category || '전체',
      maxCount: q.body.maxCount,
    })),
    queueLength: sendQueue.length,
  })
}
