// 인증 미들웨어 (Edge runtime) — 공개 경로 외엔 로그인 필수
// auth.config.ts 만 import (prisma/bcrypt 사용 X)

import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',         // NextAuth 자체 엔드포인트
  '/api/webhook',      // Brevo 웹훅 (외부 발송 상태 수신)
  '/unsubscribe',      // 수신거부 페이지 (이메일 링크)
  '/api/unsubscribe',  // 수신거부 API
  '/api/health',       // 헬스체크
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname === '/favicon.ico' || pathname.startsWith('/favicon')) return true
  if (pathname.startsWith('/images/')) return true
  if (pathname.startsWith('/videos/')) return true
  return false
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const isAuth = !!req.auth
  if (!isAuth) {
    const url = new URL('/login', req.url)
    if (pathname !== '/') url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // /admin 경로는 ADMIN 역할만
  if (pathname.startsWith('/admin')) {
    const role = (req.auth?.user as any)?.role
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
