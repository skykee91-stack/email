import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, email: true, name: true, lastLoginAt: true } },
      _count: { select: { emailSends: true, emailTemplates: true } },
    },
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#191F28', marginBottom: 4 }}>
            고객 관리
          </h1>
          <p style={{ color: '#6B7684', fontSize: 14 }}>
            고객 계정 생성 · 플랜 관리 · 도메인 세팅 상태 확인
          </p>
        </div>
        <Link
          href="/admin/customers/new"
          style={{
            background: '#3182F6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 14,
            boxShadow: '0 8px 20px rgba(49,130,246,0.3)',
          }}
        >
          + 고객 추가
        </Link>
      </div>

      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6B7684', borderBottom: '1px solid #E5E8EB' }}>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>회사</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>고객 이메일</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>도메인</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>플랜</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>발송량</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>세팅</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>생성일</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9DA4AE' }}>
                  아직 고객이 없어요. 우측 상단 "+ 고객 추가" 를 눌러 추가하세요.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F1F3F5' }}>
                <td style={{ padding: '14px 8px', fontWeight: 700 }}>{t.companyName}</td>
                <td style={{ padding: '14px 8px', color: '#4E5968' }}>
                  {t.users.map((u) => u.email).join(', ')}
                </td>
                <td style={{ padding: '14px 8px', color: '#4E5968' }}>{t.domain || '-'}</td>
                <td style={{ padding: '14px 8px' }}>
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
                <td style={{ padding: '14px 8px', color: '#4E5968' }}>
                  {t.sendUsedThisMonth} / {t.sendQuotaMonthly.toLocaleString()}
                </td>
                <td style={{ padding: '14px 8px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: t.setupStatus === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7',
                      color: t.setupStatus === 'ACTIVE' ? '#065F46' : '#B45309',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {t.setupStatus}
                  </span>
                </td>
                <td style={{ padding: '14px 8px', color: '#9DA4AE', fontSize: 12 }}>
                  {new Date(t.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td style={{ padding: '14px 8px' }}>
                  <Link
                    href={`/admin/customers/${t.id}`}
                    style={{ color: '#3182F6', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                  >
                    상세 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
