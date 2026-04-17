'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('이메일 또는 비밀번호가 일치하지 않아요')
        setLoading(false)
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError('로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F2F4F6',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'white',
          padding: 40,
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3182F6', marginBottom: 8 }}>
            셀포 메일러
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#191F28' }}>
            로그인
          </h1>
          <p style={{ fontSize: 14, color: '#6B7684', marginTop: 8 }}>
            계정으로 로그인해서 발송 대시보드를 열어요.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>이메일</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #E5E8EB',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>비밀번호</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #E5E8EB',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <div
              style={{
                background: '#FEF2F2',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: '14px 24px',
              background: loading ? '#91B6F5' : '#3182F6',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(49,130,246,0.3)',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 12, color: '#6B7684', textAlign: 'center' }}>
          계정이 필요하면 관리자에게 문의하세요.
        </p>
      </div>
    </main>
  )
}
