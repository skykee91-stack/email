// NextAuth Edge-호환 설정 (미들웨어에서 사용)
// providers 는 auth.ts 에서 합쳐짐 (Node 런타임 전용)

import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [], // auth.ts 에서 확장
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.userId = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
