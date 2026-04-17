import type { ReactNode } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <aside
        style={{
          width: 240,
          background: '#0B1220',
          color: 'white',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          셀포<span style={{ color: '#60A5FA' }}>.</span>어드민
        </div>
        <div style={{ fontSize: 12, color: '#9DA4AE', marginBottom: 24 }}>
          {session.user?.email}
        </div>
        <NavLink href="/admin">📊 대시보드</NavLink>
        <NavLink href="/admin/customers">👥 고객 관리</NavLink>
        <NavLink href="/admin/stats">📈 전체 통계</NavLink>
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #2D3748' }}>
          <Link
            href="/"
            style={{
              color: '#9DA4AE',
              fontSize: 13,
              textDecoration: 'none',
              display: 'block',
              padding: '10px 12px',
              borderRadius: 8,
            }}
          >
            ← 일반 대시보드로
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 4,
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 8,
              }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>
      <main style={{ flex: 1, background: '#F2F4F6', padding: 32, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        color: 'white',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </Link>
  )
}
