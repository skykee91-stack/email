// Brevo 이벤트 동기화
// Brevo API에서 열람/클릭/반송 이벤트를 가져와 DB에 반영
// 웹훅 누락분을 보완하는 역할

import { prisma } from '@/lib/prisma'
import { brevo } from '@/lib/brevo'
import { calculateLeadScore } from '@/lib/leads/scorer'

let lastSyncAt: Date | null = null
let syncing = false
let cronStarted = false

/**
 * 10분마다 자동 동기화 크론 시작 (서버 시작 시 1회 호출)
 */
export function startSyncCron() {
  if (cronStarted) return
  cronStarted = true

  // 서버 시작 30초 후 첫 동기화
  setTimeout(() => {
    syncBrevoEvents().then(r => {
      if (r.ok) console.log('[Brevo 동기화] 초기 동기화 완료:', (r as { stats: unknown }).stats)
    })
  }, 30000)

  // 10분마다 반복
  setInterval(() => {
    syncBrevoEvents().then(r => {
      if (r.ok) console.log('[Brevo 동기화]', (r as { stats: unknown }).stats)
    })
  }, 10 * 60 * 1000)

  console.log('[Brevo 동기화] 크론 시작 (10분 간격)')
}

/**
 * Brevo 이벤트를 DB에 동기화
 * 열람, 클릭, 반송 이벤트를 가져와서 DB에 반영
 */
export async function syncBrevoEvents() {
  if (syncing) return { skipped: true, reason: '이미 동기화 중' }
  syncing = true

  try {
    const stats = { opened: 0, clicked: 0, bounced: 0, notFound: 0 }

    // 열람 이벤트 동기화
    const openData = await brevo.getEvents({ limit: 500, event: 'opened' })
    for (const event of openData.events || []) {
      const updated = await processEvent(event, 'opened')
      if (updated) stats.opened++
      else stats.notFound++
    }

    // 클릭 이벤트 동기화
    const clickData = await brevo.getEvents({ limit: 500, event: 'click' })
    for (const event of clickData.events || []) {
      const updated = await processEvent(event, 'click')
      if (updated) stats.clicked++
    }

    // 반송 이벤트 동기화
    for (const bounceType of ['hardBounce', 'softBounce']) {
      const bounceData = await brevo.getEvents({ limit: 500, event: bounceType })
      for (const event of bounceData.events || []) {
        const updated = await processEvent(event, 'bounce')
        if (updated) stats.bounced++
      }
    }

    lastSyncAt = new Date()
    return { ok: true, stats, syncedAt: lastSyncAt }
  } catch (error) {
    return { ok: false, error: String(error) }
  } finally {
    syncing = false
  }
}

async function processEvent(event: { messageId?: string; 'message-id'?: string; date?: string; email?: string }, type: 'opened' | 'click' | 'bounce'): Promise<boolean> {
  const messageId = event.messageId || event['message-id']
  if (!messageId) return false

  const send = await prisma.emailSend.findFirst({ where: { brevoMessageId: messageId } })
  if (!send) return false

  try {
    if (type === 'opened') {
      // 이미 열람 기록이 있으면 카운트만 증가할 필요 없음 (Brevo가 정확한 카운트 제공)
      if (send.openCount === 0) {
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { openedAt: send.openedAt || new Date(event.date || Date.now()), openCount: { increment: 1 } },
        })
        await calculateLeadScore(send.businessId)
        return true
      }
    } else if (type === 'click') {
      if (send.clickCount === 0) {
        await prisma.emailSend.update({
          where: { id: send.id },
          data: {
            clickedAt: send.clickedAt || new Date(event.date || Date.now()),
            clickCount: { increment: 1 },
            openedAt: send.openedAt || new Date(),
            openCount: send.openCount > 0 ? undefined : 1,
          },
        })
        await calculateLeadScore(send.businessId)
        return true
      }
    } else if (type === 'bounce') {
      if (send.status !== 'bounced') {
        await prisma.emailSend.update({
          where: { id: send.id },
          data: { status: 'bounced', bouncedAt: new Date(event.date || Date.now()), bounceReason: 'sync from brevo' },
        })
        await prisma.business.update({ where: { id: send.businessId }, data: { status: 'bounced' } })
        return true
      }
    }
  } catch {
    // 개별 이벤트 처리 실패는 무시
  }

  return false
}

/**
 * 마지막 동기화 시간 반환
 */
export function getLastSyncTime() {
  return lastSyncAt
}
