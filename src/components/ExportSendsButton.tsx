'use client'

import { useState } from 'react'

interface Props {
  /** 어드민이 특정 테넌트 export 할 때만 넘김. 일반 고객은 자동으로 본인 테넌트 export */
  tenantId?: string
  /** 버튼 텍스트 커스텀 (기본: "📥 발송내역 다운로드") */
  label?: string
  /** 간단한 스타일 variant */
  variant?: 'primary' | 'secondary'
}

export default function ExportSendsButton({ tenantId, label, variant = 'primary' }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState(false)

  async function download() {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      if (tenantId) params.set('tenantId', tenantId)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const url = `/api/email/export?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) {
        alert('다운로드 실패: ' + res.statusText)
        setDownloading(false)
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      const filenameMatch = disposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^;\n]*))/)
      let filename = filenameMatch?.[2] || `발송내역_${new Date().toISOString().slice(0, 10)}.csv`
      filename = decodeURIComponent(filename)

      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
      setOpen(false)
    } finally {
      setDownloading(false)
    }
  }

  const primaryStyle: React.CSSProperties = {
    background: '#3182F6',
    color: 'white',
    padding: '10px 18px',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(49,130,246,0.25)',
  }
  const secondaryStyle: React.CSSProperties = {
    background: 'white',
    color: '#191F28',
    padding: '10px 18px',
    border: '1px solid #E5E8EB',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={downloading}
        style={variant === 'primary' ? primaryStyle : secondaryStyle}
      >
        {downloading ? '다운로드 중...' : label || '📥 발송내역 다운로드'}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            padding: 20,
            width: 320,
            zIndex: 10,
            border: '1px solid #E5E8EB',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#191F28', marginBottom: 12 }}>
            기간 선택 (비우면 전체)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#6B7684', fontWeight: 600 }}>시작일</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #E5E8EB',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#6B7684', fontWeight: 600 }}>종료일</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #E5E8EB',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button
              onClick={() => {
                setFrom('')
                setTo('')
                setOpen(false)
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'white',
                color: '#6B7684',
                border: '1px solid #E5E8EB',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={download}
              disabled={downloading}
              style={{
                flex: 2,
                padding: '10px',
                background: '#3182F6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {downloading ? '다운로드 중...' : '💾 다운로드'}
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#9DA4AE', lineHeight: 1.5 }}>
            엑셀(CSV) 파일로 저장됩니다. UTF-8 인코딩이라 한글 정상 표시.
          </div>
        </div>
      )}
    </div>
  )
}
