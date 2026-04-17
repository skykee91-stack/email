// Tenant 헬퍼 — 로그인 세션에서 tenant 정보 추출
// 어드민: 필터 없음 (전체 조회)
// 고객: 본인 tenantId 로 필터링

import { auth } from './auth'

export type UserRole = 'ADMIN' | 'CUSTOMER'

export interface TenantContext {
  userId: string
  role: UserRole
  tenantId: string | null
  isAdmin: boolean
}

/** 현재 요청의 Tenant 컨텍스트를 반환. 미인증이면 null. */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth()
  if (!session?.user) return null
  const user = session.user as any
  return {
    userId: user.id,
    role: user.role as UserRole,
    tenantId: user.tenantId as string | null,
    isAdmin: user.role === 'ADMIN',
  }
}

/**
 * Prisma where 절에 넣을 Tenant 필터.
 * - 어드민: `{}` (필터 없음 → 기존 동작과 동일)
 * - 고객: `{ tenantId: "..." }`
 */
export async function getTenantFilter(): Promise<
  { tenantId?: string } | Record<string, never>
> {
  const ctx = await getTenantContext()
  if (!ctx) return {}
  if (ctx.isAdmin) return {}
  if (!ctx.tenantId) return { tenantId: '__NONE__' } // 테넌트 없는 고객 → 아무것도 못 봄
  return { tenantId: ctx.tenantId }
}

/** 쓰기 작업 시 쓸 tenantId. 어드민의 경우 자기 tenantId (sellpo-default). */
export async function getWriteTenantId(): Promise<string | null> {
  const ctx = await getTenantContext()
  if (!ctx) return null
  return ctx.tenantId
}

/** ADMIN 전용 엔드포인트 가드 */
export async function requireAdmin(): Promise<TenantContext> {
  const ctx = await getTenantContext()
  if (!ctx || !ctx.isAdmin) {
    throw new Response('Forbidden: admin only', { status: 403 })
  }
  return ctx
}

/** 로그인 필수 엔드포인트 가드 */
export async function requireAuth(): Promise<TenantContext> {
  const ctx = await getTenantContext()
  if (!ctx) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return ctx
}
