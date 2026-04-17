import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const [totalTenants, activeTenants, totalSends, totalCustomers] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { setupStatus: 'ACTIVE' } }),
    prisma.emailSend.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ])

  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { users: { select: { email: true } } },
  })

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#191F28', marginBottom: 8 }}>
        어드민 대시보드
      </h1>
      <p style={{ color: '#6B7684', marginBottom: 32, fontSize: 14 }}>
        셀포 메일러 전체 운영 현황
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="전체 테넌트" value={totalTenants.toString()} sub="셀포 포함 전체" />
        <StatCard label="활성 테넌트" value={activeTenants.toString()} sub="ACTIVE 상태" />
        <StatCard
          label="누적 발송"
          value={totalSends.toLocaleString()}
          sub="모든 테넌트 합산"
        />
        <StatCard label="고객 계정" value={totalCustomers.toString()} sub="CUSTOMER 역할" />
      </div>

      <div
        style={{
          background: 'white',
          padding: 28,
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>최근 생성된 테넌트</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6B7684', borderBottom: '1px solid #E5E8EB' }}>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>회사명</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>도메인</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>플랜</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>세팅</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>고객</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>생성일</th>
            </tr>
          </thead>
          <tbody>
            {recentTenants.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9DA4AE' }}>
                  아직 테넌트가 없어요.
                </td>
              </tr>
            )}
            {recentTenants.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F1F3F5' }}>
                <td style={{ padding: '12px 8px', fontWeight: 700 }}>{t.companyName}</td>
                <td style={{ padding: '12px 8px', color: '#4E5968' }}>{t.domain || '-'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: '#EFF6FF',
                      color: '#3182F6',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {t.plan}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <SetupBadge status={t.setupStatus} />
                </td>
                <td style={{ padding: '12px 8px', color: '#4E5968', fontSize: 12 }}>
                  {t.users.map((u) => u.email).join(', ') || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#4E5968', fontSize: 12 }}>
                  {new Date(t.createdAt).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 13, color: '#6B7684', fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#3182F6', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#9DA4AE', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function SetupBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    PENDING: { bg: '#FEF3C7', fg: '#B45309' },
    DOMAIN_BOUGHT: { bg: '#DBEAFE', fg: '#1E40AF' },
    DNS_DONE: { bg: '#DBEAFE', fg: '#1E40AF' },
    VERIFIED: { bg: '#DBEAFE', fg: '#1E40AF' },
    ACTIVE: { bg: '#D1FAE5', fg: '#065F46' },
  }
  const c = colors[status] || { bg: '#E5E8EB', fg: '#4E5968' }
  return (
    <span
      style={{
        padding: '3px 10px',
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
