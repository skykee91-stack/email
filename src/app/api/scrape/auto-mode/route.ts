// 자동 수집 모드 — 큐 비면 가장 오래 전 수집한 카테고리부터 자동 추가
// GET  : 현재 설정 + 다음 카테고리 미리보기
// POST : enabled / targetPerJob 토글

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'auto-scrape-config.json')

interface AutoConfig {
  enabled: boolean
  targetPerJob: number
}

const DEFAULTS: AutoConfig = { enabled: false, targetPerJob: 1000 }

function readConfig(): AutoConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
      return { ...DEFAULTS, ...raw }
    }
  } catch {}
  return DEFAULTS
}

function writeConfig(c: AutoConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), 'utf-8')
}

// 한번이라도 done 된 카테고리 중 가장 오래 전 수집된 것
async function findNextCategory(): Promise<{ category: string; lastAt: Date | null } | null> {
  const rows = await prisma.scrapeJob.groupBy({
    by: ['category'],
    where: { status: 'done' },
    _max: { startedAt: true },
  })
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => {
    const ta = a._max.startedAt ? new Date(a._max.startedAt).getTime() : 0
    const tb = b._max.startedAt ? new Date(b._max.startedAt).getTime() : 0
    return ta - tb
  })
  return { category: sorted[0].category, lastAt: sorted[0]._max.startedAt ?? null }
}

export async function GET() {
  const cfg = readConfig()
  const next = await findNextCategory()
  return NextResponse.json({
    ...cfg,
    nextCategory: next ? { category: next.category, lastScrapedAt: next.lastAt } : null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const cfg = readConfig()
    if (typeof body.enabled === 'boolean') cfg.enabled = body.enabled
    if (typeof body.targetPerJob === 'number' && body.targetPerJob > 0) cfg.targetPerJob = body.targetPerJob
    writeConfig(cfg)
    const next = await findNextCategory()
    return NextResponse.json({
      ...cfg,
      nextCategory: next ? { category: next.category, lastScrapedAt: next.lastAt } : null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
