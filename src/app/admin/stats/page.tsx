import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' },
  })

  // 테넌트별 30일 통계
  const perTenantStats = await Promise.all(
    tenants.map(async (t) => {
      const [sent, delivered, opened, clicked, replied] = await Promise.all([
        prisma.emailSend.count({
          where: {
            tenantId: t.id,
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ['sent', 'delivered', 'bounced'] },
          },
        }),
        prisma.emailSend.count({
          where: { tenantId: t.id, createdAt: { gte: thirtyDaysAgo }, status: 'delivered' },
        }),
        prisma.emailSend.count({
          where: { tenantId: t.id, createdAt: { gte: thirtyDaysAgo }, openedAt: { not: null } },
        }),
        prisma.emailSend.count({
          where: { tenantId: t.id, createdAt: { gte: thirtyDaysAgo }, clickedAt: { not: null } },
        }),
        prisma.emailSend.count({
          where: { tenantId: t.id, createdAt: { gte: thirtyDaysAgo }, repliedAt: { not: null } },
        }),
      ])
      return {
        tenant: t,
        sent,
        delivered,
        opened,
        clicked,
        replied,
        deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
        openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0',
        clickRate: delivered > 0 ? ((clicked / delivered) * 100).toFixed(1) : '0',
      }
    })
  )

  // 전체 합산
  const total = perTenantStats.reduce(
    (acc, s) => ({
      sent: acc.sent + s.sent,
      delivered: acc.delivered + s.delivered,
      opened: acc.opened + s.opened,
      clicked: acc.clicked + s.clicked,
      replied: acc.replied + s.replied,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0 }
  )

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>전체 통계 (지난 30일)</h1>
      <p style={{ color: '#6B7684', fontSize: 14, marginBottom: 24 }}>
        모든 테넌트의 발송 지표 합산
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 32,
        }}
      >
        <StatCard label="발송" value={total.sent.toLocaleString()} />
        <StatCard label="도달" value={total.delivered.toLocaleString()} />
        <StatCard label="열람" value={total.opened.toLocaleString()} />
        <StatCard label="클릭" value={total.clicked.toLocaleString()} />
        <StatCard label="답장" value={total.replied.toLocaleString()} />
      </div>

      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>테넌트별 성과</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6B7684', borderBottom: '1px solid #E5E8EB' }}>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>회사</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>플랜</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>발송</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>도달률</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>열람률</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>클릭률</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>답장</th>
            </tr>
          </thead>
          <tbody>
            {perTenantStats.map((s) => (
              <tr key={s.tenant.id} style={{ borderBottom: '1px solid #F1F3F5' }}>
                <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.tenant.companyName}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#EFF6FF',
                      color: '#3182F6',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {s.tenant.plan}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                  {s.sent.toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#3182F6', fontWeight: 700 }}>
                  {s.deliveryRate}%
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4E5968' }}>
                  {s.openRate}%
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4E5968' }}>
                  {s.clickRate}%
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                  {s.replied}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 12, color: '#6B7684', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#191F28', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  )
}
