import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SetupControls from './SetupControls'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: true,
      _count: {
        select: {
          emailSends: true,
          emailTemplates: true,
          hotLeads: true,
          senderProfiles: true,
        },
      },
    },
  })
  if (!tenant) notFound()

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/customers" style={{ color: '#6B7684', fontSize: 13, textDecoration: 'none' }}>
          ← 고객 목록
        </a>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{tenant.companyName}</h1>
      <p style={{ color: '#6B7684', fontSize: 14, marginBottom: 24 }}>
        Tenant ID: <code style={{ fontFamily: 'monospace' }}>{tenant.id}</code>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="계약 정보">
            <Row label="플랜">{tenant.plan}</Row>
            <Row label="월 할당량">{tenant.sendQuotaMonthly.toLocaleString()}건</Row>
            <Row label="이번 달 발송">{tenant.sendUsedThisMonth.toLocaleString()}건</Row>
            <Row label="생성일">{new Date(tenant.createdAt).toLocaleString('ko-KR')}</Row>
          </Card>

          <Card title="도메인 / 발송 설정">
            <Row label="전용 도메인">{tenant.domain || '미설정'}</Row>
            <Row label="발신 이메일">{tenant.senderEmail || '미설정'}</Row>
            <Row label="발신자 표시명">{tenant.senderName}</Row>
            <Row label="답장 포워딩">{tenant.forwardTo || '미설정'}</Row>
            <Row label="Brevo Sender ID">{tenant.brevoSenderId ?? '미인증'}</Row>
            <Row label="세팅 상태">
              <SetupBadge status={tenant.setupStatus} />
            </Row>
          </Card>

          <Card title="로그인 계정">
            {tenant.users.length === 0 ? (
              <div style={{ color: '#9DA4AE', fontSize: 13 }}>계정 없음</div>
            ) : (
              tenant.users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #F1F3F5',
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ color: '#6B7684' }}>{u.email}</div>
                  <div style={{ color: '#9DA4AE', fontSize: 11, marginTop: 2 }}>
                    마지막 로그인: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '없음'}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="데이터 요약">
            <Row label="이메일 템플릿">{tenant._count.emailTemplates}개</Row>
            <Row label="누적 발송">{tenant._count.emailSends.toLocaleString()}건</Row>
            <Row label="핫리드">{tenant._count.hotLeads}개</Row>
            <Row label="발신자 프로필">{tenant._count.senderProfiles}개</Row>
          </Card>

          <Card title="도메인 세팅 체크리스트">
            <SetupSteps status={tenant.setupStatus} />
            <SetupControls
              tenantId={tenant.id}
              currentStatus={
                tenant.setupStatus as 'PENDING' | 'DOMAIN_BOUGHT' | 'DNS_DONE' | 'VERIFIED' | 'ACTIVE'
              }
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 800, color: '#191F28', marginBottom: 14 }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #F1F3F5',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#6B7684' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#191F28' }}>{children}</span>
    </div>
  )
}

function SetupBadge({ status }: { status: string }) {
  const c =
    status === 'ACTIVE'
      ? { bg: '#D1FAE5', fg: '#065F46' }
      : { bg: '#FEF3C7', fg: '#B45309' }
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 6,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  )
}

const ORDER = ['PENDING', 'DOMAIN_BOUGHT', 'DNS_DONE', 'VERIFIED', 'ACTIVE'] as const
const LABELS: Record<string, string> = {
  PENDING: '신규 등록',
  DOMAIN_BOUGHT: '도메인 구매 완료',
  DNS_DONE: 'DNS 설정 완료',
  VERIFIED: 'Brevo 인증 완료',
  ACTIVE: '활성화 완료',
}

function SetupSteps({ status }: { status: string }) {
  const currentIdx = ORDER.indexOf(status as (typeof ORDER)[number])
  return (
    <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ORDER.map((step, i) => {
        const done = i < currentIdx || step === 'ACTIVE' && currentIdx === 4
        const current = i === currentIdx
        return (
          <li
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: done ? '#065F46' : current ? '#3182F6' : '#9DA4AE',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: done ? '#10B981' : current ? '#3182F6' : '#E5E8EB',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            <span style={{ fontWeight: current ? 800 : 500 }}>{LABELS[step]}</span>
          </li>
        )
      })}
    </ol>
  )
}
