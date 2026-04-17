interface TenantInfo {
  companyName: string
  setupStatus: string
  domain: string | null
}

const MESSAGES: Record<string, { text: string; color: string; bg: string }> = {
  PENDING: {
    text: '어드민이 전용 도메인 세팅을 시작할 예정이에요. 곧 연락드릴게요.',
    color: '#92400E',
    bg: '#FEF3C7',
  },
  DOMAIN_BOUGHT: {
    text: '전용 도메인 구매 완료. DNS 설정 진행 중 — 약 24시간 이내 완료 예정.',
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
  DNS_DONE: {
    text: 'DNS 설정 완료. 발송 인증 진행 중 — 거의 끝났어요.',
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
  VERIFIED: {
    text: '인증 완료 ✓ 활성화 직전 — 테스트 발송 진행 중.',
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
}

export default function SetupStatusBanner({ tenant }: { tenant: TenantInfo }) {
  const msg = MESSAGES[tenant.setupStatus]
  if (!msg) return null // ACTIVE 거나 unknown → 배너 없음

  return (
    <div
      style={{
        background: msg.bg,
        color: msg.color,
        padding: '12px 20px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 16 }}>📬</span>
      <span>{msg.text}</span>
    </div>
  )
}
