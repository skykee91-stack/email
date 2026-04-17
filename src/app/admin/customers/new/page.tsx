'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    customerName: '',
    customerEmail: '',
    customerPassword: '',
    plan: 'BASIC' as 'BASIC' | 'STANDARD' | 'PREMIUM',
    domain: '',
    senderEmail: '',
    senderName: '',
    forwardTo: '',
  })

  const planLabel = {
    BASIC: 'Basic · 월 2,000건',
    STANDARD: 'Standard · 월 8,000건',
    PREMIUM: 'Premium · 월 20,000건',
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '생성 실패')
        setSubmitting(false)
        return
      }
      router.push('/admin/customers')
      router.refresh()
    } catch (err) {
      setError(String(err))
      setSubmitting(false)
    }
  }

  function field(label: string, key: keyof typeof form, type = 'text', placeholder = '') {
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4E5968' }}>{label}</span>
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #E5E8EB',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </label>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>신규 고객 추가</h1>
      <p style={{ color: '#6B7684', fontSize: 14, marginBottom: 24 }}>
        고객 정보를 입력하면 Tenant + 로그인 계정이 함께 생성됩니다. 도메인 세팅은 생성 후 [상세] 에서 진행하세요.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          background: 'white',
          padding: 28,
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>👤 고객 정보</h2>
        {field('회사명 *', 'companyName', 'text', '강남사장 마케팅')}
        {field('담당자 이름 *', 'customerName', 'text', '김사장')}
        {field('로그인 이메일 *', 'customerEmail', 'email', 'kim@example.com')}
        {field('초기 비밀번호 *', 'customerPassword', 'text', '무작위 12자 이상 권장')}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4E5968' }}>플랜 *</span>
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value as typeof form.plan })}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #E5E8EB',
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="BASIC">{planLabel.BASIC}</option>
            <option value="STANDARD">{planLabel.STANDARD}</option>
            <option value="PREMIUM">{planLabel.PREMIUM}</option>
          </select>
        </label>

        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#191F28', marginTop: 16 }}>
          ✉️ 발송 도메인 (나중에 세팅해도 OK)
        </h2>
        {field('전용 도메인', 'domain', 'text', 'kim-sales.com (비워두면 나중에)')}
        {field('발신 이메일', 'senderEmail', 'email', 'kim@kim-sales.com')}
        {field('발신자 표시명', 'senderName', 'text', '강남사장 마케팅')}
        {field('답장 포워딩 주소', 'forwardTo', 'email', 'kim@naver.com (비우면 로그인 이메일 사용)')}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '12px 20px',
              background: 'white',
              color: '#4E5968',
              border: '1px solid #E5E8EB',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 20px',
              background: submitting ? '#91B6F5' : '#3182F6',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
              flex: 1,
              boxShadow: '0 8px 20px rgba(49,130,246,0.3)',
            }}
          >
            {submitting ? '생성 중...' : '고객 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
