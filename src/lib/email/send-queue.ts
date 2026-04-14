// 일반 발송(bulk)과 팔로업(followup)이 공유하는 백그라운드 발송 큐.
// - 동시에 두 작업이 돌지 않도록 순차 실행 보장
// - 이미 실행 중이면 자동으로 큐 대기
// - 한 곳에서 상태 조회 (GET /api/email/send)

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
