'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ORDER = ['PENDING', 'DOMAIN_BOUGHT', 'DNS_DONE', 'VERIFIED', 'ACTIVE'] as const
type SetupStatus = (typeof ORDER)[number]

const STEP_INSTRUCTIONS: Record<SetupStatus, string> = {
  PENDING: '1️⃣ 가비아/아이네임즈에서 도메인 구매 → 구매 완료되면 [다음] 클릭',
  DOMAIN_BOUGHT: '2️⃣ Cloudflare 에 도메인 연결 + SPF/DKIM/DMARC DNS 레코드 추가 → 완료되면 [다음]',
  DNS_DONE: '3️⃣ Brevo 에서 도메인·sender 인증 + 인증 메일 클릭 → 완료되면 [다음]',
  VERIFIED: '4️⃣ Cloudflare Email Routing 으로 답장 포워딩 설정 + 테스트 발송 1건 → 성공이면 [활성화]',
  ACTIVE: '✅ 세팅 완료. 고객이 발송 시작 가능!',
}

export default function SetupControls({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: SetupStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const currentIdx = ORDER.indexOf(currentStatus)
  const nextStatus = currentIdx < ORDER.length - 1 ? ORDER[currentIdx + 1] : null

  async function advance() {
    if (!nextStatus) return
    if (!confirm(`세팅 상태를 "${nextStatus}" 로 변경할까요?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, setupStatus: nextStatus }),
      })
      if (!res.ok) {
        alert('변경 실패: ' + (await res.text()))
        setLoading(false)
        return
      }
      router.refresh()
    } catch (e) {
      alert('오류: ' + String(e))
      setLoading(false)
    }
  }

  async function reset() {
    if (!confirm('세팅을 처음(PENDING)으로 되돌릴까요?')) return
    setLoading(true)
    try {
      await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, setupStatus: 'PENDING' }),
      })
      router.refresh()
    } catch (e) {
      alert(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: '#F8FAFF',
        border: '1px solid #DBEAFE',
        borderRadius: 12,
      }}
    >
      <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 700, marginBottom: 8 }}>
        👉 지금 할 일
      </div>
      <div style={{ fontSize: 13, color: '#191F28', lineHeight: 1.6, marginBottom: 16 }}>
        {STEP_INSTRUCTIONS[currentStatus]}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {nextStatus && (
          <button
            onClick={advance}
            disabled={loading}
            style={{
              padding: '10px 16px',
              background: loading ? '#91B6F5' : '#3182F6',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '처리 중...' : nextStatus === 'ACTIVE' ? '활성화 →' : '다음 단계 →'}
          </button>
        )}
        {currentStatus !== 'PENDING' && (
          <button
            onClick={reset}
            disabled={loading}
            style={{
              padding: '10px 16px',
              background: 'white',
              color: '#4E5968',
              border: '1px solid #E5E8EB',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            처음으로
          </button>
        )}
      </div>
    </div>
  )
}
