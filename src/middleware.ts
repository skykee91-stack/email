// 인증 미들웨어 — 공개 경로 외엔 로그인 필수
// 공개: /login, /api/auth/*, /api/webhook/*, /unsubscribe, /api/unsubscribe/*

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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
  // Next.js 내부 리소스
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

// matcher: 모든 경로 (미들웨어에서 세부 제어)
export const config = {
  matcher: [
    // API 라우트, 정적 파일 제외하고 모두 대상
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
