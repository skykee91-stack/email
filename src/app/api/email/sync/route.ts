import { NextResponse } from 'next/server'
import { syncBrevoEvents, getLastSyncTime, startSyncCron } from '@/lib/email/sync'

// 크론 자동 시작
startSyncCron()

// GET: 동기화 상태 확인
export async function GET() {
  return NextResponse.json({ lastSyncAt: getLastSyncTime() })
}

// POST: 수동 동기화 실행
export async function POST() {
  const result = await syncBrevoEvents()
  return NextResponse.json(result)
}
