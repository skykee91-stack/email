// 스크래핑 시작 API
// POST /api/scrape/start → 스크래핑 작업 시작
// 모드 1: 로컬 (Python subprocess) - SCRAPER_PATH 설정 시
// 모드 2: 원격 API (SCRAPER_API_URL 설정 시) - Vercel에서도 사용 가능

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

const SCRAPER_API_URL = process.env.SCRAPER_API_URL // 예: http://localhost:8000

// 실행 중인 작업 관리
let currentJob: {
  id: string
  pid: number | null
  status: 'running' | 'done' | 'failed'
  found: number
  target: number
  category: string
  region: string
  mode: 'local' | 'remote'
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

    // 원격 API 모드 (Vercel에서도 사용 가능)
    if (SCRAPER_API_URL) {
      return await startRemoteScrape(job.id, searchTerm, region, target)
    }

    // Python 스크래퍼 실행
    const scraperPath = process.env.SCRAPER_PATH || 'C:/Users/a/naver_place_scraper'
    // 시/도 이름만 입력하면 자동으로 구 단위로 분배
    const CITY_TO_DISTRICTS: Record<string, string[]> = {
      '서울': ['서울 강남구','서울 서초구','서울 송파구','서울 마포구','서울 영등포구','서울 강동구','서울 관악구','서울 강서구','서울 성동구','서울 종로구','서울 중구','서울 용산구','서울 광진구','서울 동대문구','서울 중랑구','서울 성북구','서울 강북구','서울 도봉구','서울 노원구','서울 은평구','서울 서대문구','서울 구로구','서울 금천구','서울 동작구','서울 양천구'],
      '부산': ['부산 해운대구','부산 수영구','부산 남구','부산 동래구','부산 부산진구','부산 사하구','부산 북구','부산 사상구','부산 연제구','부산 금정구'],
      '인천': ['인천 남동구','인천 부평구','인천 서구','인천 연수구','인천 미추홀구','인천 계양구','인천 중구','인천 동구'],
      '대구': ['대구 수성구','대구 달서구','대구 북구','대구 중구','대구 동구','대구 서구','대구 남구'],
      '대전': ['대전 유성구','대전 서구','대전 중구','대전 동구','대전 대덕구'],
      '광주': ['광주 북구','광주 서구','광주 남구','광주 광산구','광주 동구'],
      '수원': ['수원 영통구','수원 권선구','수원 장안구','수원 팔달구'],
      '성남': ['성남 분당구','성남 수정구','성남 중원구'],
    }
    let regions: string
    if (!region) {
      regions = JSON.stringify(CITY_TO_DISTRICTS['서울'])
    } else if (CITY_TO_DISTRICTS[region]) {
      regions = JSON.stringify(CITY_TO_DISTRICTS[region])
    } else {
      regions = `["${region}"]`
    }

    // Python 스크립트를 파일로 저장 후 실행 (한글/따옴표 깨짐 방지)
    const scriptPath = path.join(scraperPath, '_web_scrape_task.py')
    // 1) Python으로 설정 파일 생성 (한글 깨짐 방지 - Python이 직접 한글 처리)
    const configPath = path.join(scraperPath, '_web_scrape_config.json').replace(/\\/g, '/')
    const runnerPath = path.join(scraperPath, 'web_scrape_runner.py').replace(/\\/g, '/')
    const makeConfigScript = path.join(scraperPath, '_make_config.py').replace(/\\/g, '/')

    // _make_config.py는 고정된 ASCII 스크립트, sys.argv로 값을 받음
    // region에 공백이 있을 수 있으므로 구분자로 ||| 사용
    const regionArg = region || '__DEFAULT__'
    const configArgs = [searchTerm, regionArg, String(target)].join('|||')

    // 환경변수로 전달 (환경변수는 유니코드 지원)
    // 한글을 hex로 인코딩해서 환경변수로 전달 (Windows 한글 깨짐 방지)
    const configHex = Buffer.from(JSON.stringify({ category: searchTerm, region: region || '', target }), 'utf-8').toString('hex')

    const child = exec(`python -u "${runnerPath}"`, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: scraperPath,
      env: { ...process.env, SCRAPE_CONFIG_HEX: configHex },
    })

    currentJob = {
      id: job.id,
      pid: child.pid || null,
      status: 'running',
      found: 0,
      target,
      category: searchTerm,
      region: region || '전국',
      mode: 'local',
    }

    child.stderr?.on('data', (data: string) => {
      console.error('[scraper stderr]', data.toString())
    })

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

// 원격 API로 스크래핑 시작
async function startRemoteScrape(jobId: string, searchTerm: string, region: string, target: number) {
  try {
    const res = await fetch(`${SCRAPER_API_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: searchTerm, region: region || '', target }),
    })
    const data = await res.json()

    if (data.error) {
      await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: data.error } })
      return NextResponse.json({ error: data.error }, { status: 409 })
    }

    currentJob = {
      id: jobId, pid: null, status: 'running', found: 0,
      target, category: searchTerm, region: region || '전국', mode: 'remote',
    }

    // 백그라운드에서 원격 상태 폴링 + 완료 시 DB 저장
    pollRemoteStatus(jobId)

    return NextResponse.json({ ok: true, jobId, mode: 'remote', message: `${searchTerm} 원격 수집 시작 (목표: ${target}개)` })
  } catch (error) {
    await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: String(error) } })
    return NextResponse.json({ error: `스크래퍼 API 연결 실패: ${error}` }, { status: 500 })
  }
}

// 원격 스크래퍼 상태 폴링
function pollRemoteStatus(jobId: string) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${SCRAPER_API_URL}/status`)
      const data = await res.json()

      if (currentJob) {
        currentJob.found = data.found || 0
      }

      if (data.status === 'done' || data.status === 'failed') {
        clearInterval(interval)
        if (currentJob) currentJob.status = data.status

        if (data.status === 'done') {
          // 결과 가져와서 DB에 저장
          const resultRes = await fetch(`${SCRAPER_API_URL}/results`)
          const resultData = await resultRes.json()
          const businesses = resultData.businesses || []

          if (businesses.length > 0) {
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

            await prisma.scrapeJob.update({
              where: { id: jobId },
              data: {
                status: 'done', totalFound: businesses.length,
                totalSaved: toCreate.length, withEmail: businesses.length,
                finishedAt: new Date(),
              },
            })
          }
        } else {
          await prisma.scrapeJob.update({
            where: { id: jobId },
            data: { status: 'failed', errorMessage: data.error, finishedAt: new Date() },
          })
        }
      }
    } catch {}
  }, 5000) // 5초마다 체크
}

// GET: 현재 작업 상태 조회
export async function GET() {
  // 원격 모드면 원격 상태도 함께 반환
  const mode = SCRAPER_API_URL ? 'remote' : 'local'
  let scraperOnline = false

  if (SCRAPER_API_URL) {
    try {
      const res = await fetch(`${SCRAPER_API_URL}/`, { signal: AbortSignal.timeout(3000) })
      scraperOnline = res.ok
    } catch {}
  }

  return NextResponse.json({ job: currentJob, mode, scraperOnline })
}
