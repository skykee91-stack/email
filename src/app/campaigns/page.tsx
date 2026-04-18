'use client'

import { useEffect, useState } from 'react'

interface Campaign {
  id: string
  name: string
  description: string | null
  targetTotal: number
  currentTotal: number
  status: string
  targetCategory: string | null
  targetRegion: string | null
  createdAt: string
  finishedAt: string | null
  _count: { emailSends: number }
  tenant?: { companyName: string }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    targetTotal: 10000,
    description: '',
    targetCategory: '',
    targetRegion: '',
  })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function create() {
    if (!form.name || !form.targetTotal) return
    setCreating(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || '생성 실패')
        return
      }
      setForm({ name: '', targetTotal: 10000, description: '', targetCategory: '', targetRegion: '' })
      load()
    } finally {
      setCreating(false)
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch('/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  async function del(id: string) {
    if (!confirm('이 캠페인을 삭제할까요? (발송 이력이 있으면 삭제 불가)')) return
    const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '삭제 실패')
    }
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">캠페인 (주문 관리)</h1>
          <p className="text-gray-400 mt-1">주문별로 발송 건수를 계약 수량까지 관리</p>
        </div>
      </div>

      {/* 생성 폼 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-bold text-white mb-3">➕ 새 캠페인 추가</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold">캠페인명 *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="2026-04 치과 1만건"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold">계약 수량 * (1~4차 합산)</span>
            <input
              type="number"
              value={form.targetTotal}
              onChange={(e) => setForm({ ...form, targetTotal: parseInt(e.target.value) || 0 })}
              min={1}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold">대상 업종 (메모)</span>
            <input
              type="text"
              value={form.targetCategory}
              onChange={(e) => setForm({ ...form, targetCategory: e.target.value })}
              placeholder="치과"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold">대상 지역 (메모)</span>
            <input
              type="text"
              value={form.targetRegion}
              onChange={(e) => setForm({ ...form, targetRegion: e.target.value })}
              placeholder="서울"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold">메모</span>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="특이사항/고객 요청사항"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </label>
        </div>
        <button
          onClick={create}
          disabled={creating || !form.name || !form.targetTotal}
          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-bold rounded"
        >
          {creating ? '생성 중...' : '캠페인 추가'}
        </button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-gray-400">불러오는 중...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center text-gray-400">
          아직 캠페인이 없어요
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const progress = c.targetTotal > 0 ? (c.currentTotal / c.targetTotal) * 100 : 0
            const isDone = c.status === 'completed' || c.currentTotal >= c.targetTotal
            return (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{c.name}</h3>
                      <StatusBadge status={c.status} />
                      {c.tenant && (
                        <span className="text-xs text-gray-500">· {c.tenant.companyName}</span>
                      )}
                    </div>
                    {(c.targetCategory || c.targetRegion) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {c.targetCategory && <span>{c.targetCategory}</span>}
                        {c.targetCategory && c.targetRegion && <span> · </span>}
                        {c.targetRegion && <span>{c.targetRegion}</span>}
                      </p>
                    )}
                    {c.description && (
                      <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {c.status === 'active' && (
                      <button
                        onClick={() => setStatus(c.id, 'paused')}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-yellow-400 text-xs font-bold rounded"
                      >
                        일시정지
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button
                        onClick={() => setStatus(c.id, 'active')}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-green-400 text-xs font-bold rounded"
                      >
                        재개
                      </button>
                    )}
                    {c.status !== 'completed' && (
                      <button
                        onClick={() => setStatus(c.id, 'completed')}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded"
                      >
                        완료처리
                      </button>
                    )}
                    {c._count.emailSends === 0 && (
                      <button
                        onClick={() => del(c.id)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs font-bold rounded"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-gray-400">
                      {c.currentTotal.toLocaleString()} / {c.targetTotal.toLocaleString()}건 발송
                      {' · '}
                      <span className="text-white font-bold">{progress.toFixed(1)}%</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {c._count.emailSends.toLocaleString()}개 레코드 (모든 차수 합산)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDone
                          ? 'bg-green-500'
                          : progress > 80
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  생성: {new Date(c.createdAt).toLocaleString('ko-KR')}
                  {c.finishedAt && <> · 완료: {new Date(c.finishedAt).toLocaleString('ko-KR')}</>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: '진행 중', cls: 'bg-blue-900 text-blue-300' },
    paused: { label: '일시정지', cls: 'bg-yellow-900 text-yellow-300' },
    completed: { label: '완료', cls: 'bg-green-900 text-green-300' },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-800 text-gray-300' }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  )
}
