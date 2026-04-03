// 스크래핑 시작 API
// POST /api/scrape/start → 스크래핑 작업 시작
// 실제 스크래핑은 Python 스크래퍼를 subprocess로 실행

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'

// 실행 중인 작업 관리
let currentJob: {
  id: string
  pid: number | null
  status: 'running' | 'done' | 'failed'
  found: number
  target: number
  category: string
  region: string
} | null = null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, category, region, target = 100 } = body

    // 검색어 또는 카테고리 필수
    const searchTerm = query || category
    if (!searchTerm) {
      return NextResponse.json({ error: '검색어 또는 카테고리를 입력하세요' }, { status: 400 })
    }

    // 이미 실행 중이면 거부
    if (currentJob?.status === 'running') {
      return NextResponse.json({
        error: '이미 수집 중입니다',
        job: currentJob,
      }, { status: 409 })
    }

    // 수집 작업 DB 기록
    const job = await prisma.scrapeJob.create({
      data: {
        region: region || '전국',
        category: searchTerm,
        maxResults: target,
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Python 스크래퍼 실행
    const scraperPath = process.env.SCRAPER_PATH || 'C:/Users/a/naver_place_scraper'
    const regions = region
      ? `["${region}"]`
      : '["서울 강남구","서울 서초구","서울 송파구","서울 마포구","서울 영등포구","서울 강동구","서울 관악구","서울 강서구","서울 성동구","서울 종로구"]'

    const pythonScript = `
import asyncio, json, random, sys
sys.path.insert(0, '${scraperPath.replace(/\\/g, '/')}')
from scraper.browser import create_browser
from scraper.search import navigate_to_search, collect_all_entries, get_search_frame
from scraper.detail import click_and_extract
from config import DEFAULT_DELAY_MIN, DEFAULT_DELAY_MAX, LONG_PAUSE_INTERVAL, LONG_PAUSE_MIN, LONG_PAUSE_MAX
import logging
logging.basicConfig(level=logging.WARNING)

async def scrape():
    results = []
    seen = set()
    regions = ${regions}
    category = "${searchTerm}"
    target = ${target}
    per_region = max(30, (target * 3) // len(regions) + 10)

    async with create_browser(headed=False) as (browser, context, page):
        for ri, region in enumerate(regions):
            if len(results) >= target: break
            try:
                sf = await navigate_to_search(page, region, category)
                entries = await collect_all_entries(page, sf, per_region)
                if not entries: continue
                sf = await get_search_frame(page)
                for idx, entry in enumerate(entries):
                    if len(results) >= target: break
                    if entry['name'] in seen: continue
                    biz = await click_and_extract(page, sf, entry, category, context=context, search_region=region)
                    if biz:
                        seen.add(biz.name)
                        if biz.email:
                            results.append({
                                'name': biz.name, 'phone': biz.phone, 'email': biz.email,
                                'address': biz.address, 'category': category, 'region': region,
                                'naverId': biz.naver_id, 'blogUrl': biz.blog_url,
                                'homepageUrl': biz.homepage_url, 'placeId': biz.place_id,
                            })
                            print(json.dumps({'found': len(results), 'name': biz.name, 'email': biz.email}), flush=True)
                    await asyncio.sleep(random.uniform(DEFAULT_DELAY_MIN, DEFAULT_DELAY_MAX))
                    if (idx+1) % LONG_PAUSE_INTERVAL == 0:
                        await asyncio.sleep(random.uniform(LONG_PAUSE_MIN, LONG_PAUSE_MAX))
                    try: sf = await get_search_frame(page)
                    except:
                        sf = await navigate_to_search(page, region, category)
                        sf = await get_search_frame(page)
            except: pass

    with open('${scraperPath.replace(/\\/g, '/')}/web_scrape_result.json', 'w', encoding='utf-8') as f:
        json.dump({'businesses': results}, f, ensure_ascii=False)
    print(json.dumps({'done': True, 'total': len(results)}), flush=True)

asyncio.run(scrape())
`

    const child = exec(`python -u -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
      maxBuffer: 10 * 1024 * 1024,
    })

    currentJob = {
      id: job.id,
      pid: child.pid || null,
      status: 'running',
      found: 0,
      target,
      category: searchTerm,
      region: region || '전국',
    }

    child.stdout?.on('data', (data: string) => {
      try {
        const lines = data.trim().split('\n')
        for (const line of lines) {
          const msg = JSON.parse(line)
          if (msg.found && currentJob) {
            currentJob.found = msg.found
          }
          if (msg.done && currentJob) {
            currentJob.status = 'done'
          }
        }
      } catch {}
    })

    child.on('exit', async (code) => {
      if (currentJob) {
        currentJob.status = code === 0 ? 'done' : 'failed'
      }
      // 결과 파일에서 DB에 자동 업로드
      try {
        const fs = await import('fs')
        const resultPath = `${scraperPath}/web_scrape_result.json`
        if (fs.existsSync(resultPath)) {
          const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
          if (data.businesses?.length > 0) {
            // 벌크 등록 (중복 건너뛰기)
            const businesses = data.businesses
            const placeIds = businesses.map((b: { placeId?: string }) => b.placeId).filter(Boolean)
            const existing = placeIds.length > 0
              ? await prisma.business.findMany({ where: { placeId: { in: placeIds } }, select: { placeId: true } })
              : []
            const existingSet = new Set(existing.map(e => e.placeId))

            const toCreate = businesses.filter((b: { placeId?: string }) => !b.placeId || !existingSet.has(b.placeId))
            if (toCreate.length > 0) {
              await prisma.business.createMany({
                data: toCreate.map((b: Record<string, string | null>) => ({
                  name: b.name, phone: b.phone || null, email: b.email || null,
                  address: b.address || null, category: b.category || null,
                  region: b.region || null, naverId: b.naverId || null,
                  blogUrl: b.blogUrl || null, homepageUrl: b.homepageUrl || null,
                  placeId: b.placeId || null,
                })),
                skipDuplicates: true,
              })
            }
            // DB 작업 기록 업데이트
            await prisma.scrapeJob.update({
              where: { id: job.id },
              data: {
                status: 'done',
                totalFound: businesses.length,
                totalSaved: toCreate.length,
                withEmail: businesses.length,
                finishedAt: new Date(),
              },
            })
          }
        }
      } catch (e) {
        console.error('결과 DB 업로드 실패:', e)
      }
    })

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      message: `${searchTerm} 수집 시작 (목표: ${target}개)`,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET: 현재 작업 상태 조회
export async function GET() {
  return NextResponse.json({ job: currentJob })
}
