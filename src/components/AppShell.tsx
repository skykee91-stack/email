'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import UserMenu from './UserMenu'
import SetupStatusBanner from './SetupStatusBanner'

interface SessionUser {
  email?: string | null
  name?: string | null
  role?: 'ADMIN' | 'CUSTOMER' | null
  tenantId?: string | null
}

interface TenantInfo {
  companyName: string
  setupStatus: string
  domain: string | null
}

export default function AppShell({
  children,
  user,
  tenant,
}: {
  children: React.ReactNode
  user: SessionUser | null
  tenant: TenantInfo | null
}) {
  const pathname = usePathname()

  // /login, /admin 은 사이드바 없이 렌더 (각자 전용 레이아웃)
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar user={user} />
      <main className="flex-1 ml-64 p-8">
        {tenant && <SetupStatusBanner tenant={tenant} />}
        {children}
      </main>
    </>
  )
}
