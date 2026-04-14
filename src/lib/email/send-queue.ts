// 일반 발송(bulk)과 팔로업(followup)이 공유하는 백그라운드 발송 큐.
// - 동시에 두 작업이 돌지 않도록 순차 실행 보장
// - 이미 실행 중이면 자동으로 큐 대기
// - 한 곳에서 상태 조회 (GET /api/email/send)
// - 진행 상황은 DB 실시간 집계 (getSendStateLive) — sendBulkEmails가 완료 때만
//   콜백을 주는 구조라 진행 중 카운트를 UI에 보여주지 못하는 문제를 우회한다.

import { prisma } from '@/lib/prisma'

export type SendJobKind = 'bulk' | 'followup'

export interface SendJob {
  id: string
  kind: SendJobKind
  status: 'running' | 'done' | 'failed'
  templateName: string
  category: string // 보여줄 라벨
  totalTargets: number
  sent: number
  skipped: number
  startedAt: string
  finishedAt?: string
  // 추가 정보 (팔로업 단계별 breakdown 등)
  metadata?: Record<string, unknown>
}

type UpdateFn = (partial: Partial<SendJob>) => void

export interface QueuedEntry {
  jobInfo: {
    kind: SendJobKind
    templateName: string
    category: string
    totalTargets: number
  }
  // runner는 현재 작업 상태를 갱신하는 update 콜백을 받고,
  // 최종 {sent, skipped} 결과를 리턴해야 한다.
  runner: (update: UpdateFn) => Promise<{ sent: number; skipped: number }>
}

let currentJob: SendJob | null = null
const queue: QueuedEntry[] = []

export function getSendState() {
  return {
    sendJob: currentJob,
    queue: queue.map((q, i) => ({
      position: i + 1,
      kind: q.jobInfo.kind,
      templateName: q.jobInfo.templateName,
      category: q.jobInfo.category,
      totalTargets: q.jobInfo.totalTargets,
    })),
    queueLength: queue.length,
  }
}

/**
 * 실행 중인 job의 sent/skipped를 DB에서 실시간으로 가져와 덮어쓴 상태를 반환.
 * 현재 job의 startedAt 이후에 생성된 EmailSend 레코드를 집계한다.
 * - sent   = status IN ('sent','delivered') + createdAt ≥ startedAt
 * - skipped = status = 'bounced' + createdAt ≥ startedAt
 * (sender.ts에서 수신거부/중복 등의 사전 스킵은 EmailSend 레코드를 만들지 않으므로
 *  여기서는 집계되지 않음. 최종 결과는 runner resolve 시점에 덮어씌워진다.)
 */
export async function getSendStateLive() {
  const base = getSendState()
  if (base.sendJob?.status === 'running') {
    try {
      const startedAt = new Date(base.sendJob.startedAt)
      const [sent, skipped] = await Promise.all([
        prisma.emailSend.count({
          where: {
            createdAt: { gte: startedAt },
            status: { in: ['sent', 'delivered'] },
          },
        }),
        prisma.emailSend.count({
          where: {
            createdAt: { gte: startedAt },
            status: 'bounced',
          },
        }),
      ])
      return {
        ...base,
        sendJob: { ...base.sendJob, sent, skipped },
      }
    } catch (e) {
      console.error('[send-queue] 실시간 집계 실패:', e)
    }
  }
  return base
}

export function isRunning(): boolean {
  return currentJob?.status === 'running'
}

export function enqueueSendJob(entry: QueuedEntry): {
  queued: boolean
  position?: number
  job: SendJob
} {
  if (isRunning()) {
    queue.push(entry)
    return {
      queued: true,
      position: queue.length,
      job: currentJob!,
    }
  }
  const job = startJob(entry)
  return { queued: false, job }
}

function startJob(entry: QueuedEntry): SendJob {
  const jobId = Date.now().toString()
  currentJob = {
    id: jobId,
    kind: entry.jobInfo.kind,
    status: 'running',
    templateName: entry.jobInfo.templateName,
    category: entry.jobInfo.category,
    totalTargets: entry.jobInfo.totalTargets,
    sent: 0,
    skipped: 0,
    startedAt: new Date().toISOString(),
  }

  const update: UpdateFn = (partial) => {
    if (currentJob?.id === jobId) {
      Object.assign(currentJob, partial)
    }
  }

  entry
    .runner(update)
    .then((result) => {
      if (currentJob?.id === jobId) {
        currentJob.status = 'done'
        currentJob.sent = result.sent
        currentJob.skipped = result.skipped
        currentJob.finishedAt = new Date().toISOString()
      }
      processNext()
    })
    .catch((e) => {
      console.error(`[send-queue] ${entry.jobInfo.kind} 실행 오류:`, e)
      if (currentJob?.id === jobId) {
        currentJob.status = 'failed'
        currentJob.finishedAt = new Date().toISOString()
      }
      processNext()
    })

  return currentJob
}

function processNext() {
  if (queue.length === 0) return
  const next = queue.shift()!
  startJob(next)
}
