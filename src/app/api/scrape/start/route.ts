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

// 수집 큐
interface QueueItem {
  id: string
  category: string
  region: string
  target: number
  status: 'waiting' | 'running' | 'done' | 'failed'
}
const scrapeQueue: QueueItem[] = []

// 자동 수집 모드 설정 — auto-scrape-config.json 으로 영구 저장
const AUTO_CONFIG_PATH = path.join(process.cwd(), 'auto-scrape-config.json')

function readAutoConfig(): { enabled: boolean; targetPerJob: number } {
  try {
    if (fs.existsSync(AUTO_CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(AUTO_CONFIG_PATH, 'utf-8'))
      return { enabled: !!raw.enabled, targetPerJob: raw.targetPerJob || 1000 }
    }
  } catch {}
  return { enabled: false, targetPerJob: 1000 }
}

// 큐 비어있고 자동 모드 ON 이면 가장 오래 전 수집한 카테고리를 큐에 추가
async function maybeAutoFillQueue() {
  if (scrapeQueue.length > 0) return
  if (currentJob?.status === 'running') return
  const cfg = readAutoConfig()
  if (!cfg.enabled) return
  try {
    const rows = await prisma.scrapeJob.groupBy({
      by: ['category'],
      where: { status: 'done' },
      _max: { startedAt: true },
    })
    if (rows.length === 0) return
    const sorted = [...rows].sort((a, b) => {
      const ta = a._max.startedAt ? new Date(a._max.startedAt).getTime() : 0
      const tb = b._max.startedAt ? new Date(b._max.startedAt).getTime() : 0
      return ta - tb
    })
    const nextCat = sorted[0].category
    const newJob = await prisma.scrapeJob.create({
      data: {
        region: '전국',
        category: nextCat,
        maxResults: cfg.targetPerJob,
        status: 'pending',
      },
    })
    scrapeQueue.push({
      id: newJob.id,
      category: nextCat,
      region: '',
      target: cfg.targetPerJob,
      status: 'waiting',
    })
    console.log(`[자동 수집] ${nextCat} 큐에 추가됨 (target: ${cfg.targetPerJob})`)
  } catch (e) {
    console.error('[자동 수집] 다음 카테고리 추가 실패:', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, category, region, target = 100, keywords } = body

    // 검색어 또는 카테고리 필수
    const searchTerm = query || category
    if (!searchTerm) {
      return NextResponse.json({ error: '검색어 또는 카테고리를 입력하세요' }, { status: 400 })
    }

    // 이미 실행 중이면 큐에 추가
    if (currentJob?.status === 'running') {
      const queueJob = await prisma.scrapeJob.create({
        data: {
          region: region || '전국',
          category: searchTerm,
          maxResults: target,
          status: 'pending',
        },
      })
      scrapeQueue.push({
        id: queueJob.id,
        category: searchTerm,
        region: region || '',
        target,
        status: 'waiting',
      })
      return NextResponse.json({
        ok: true,
        queued: true,
        position: scrapeQueue.length,
        message: `${searchTerm} 수집이 대기열에 추가됨 (${scrapeQueue.length}번째)`,
      })
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
    // DB에 있는 기존 업체 placeId를 히스토리에 합치기 (중복 수집 방지)
    try {
      const historyPath = path.join(scraperPath, 'collected_history.json').replace(/\\/g, '/')
      let existingIds: string[] = []
      if (fs.existsSync(historyPath)) {
        try {
          const h = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
          existingIds = h.collected_ids || []
        } catch {}
      }
      const dbPlaceIds = await prisma.business.findMany({
        where: { placeId: { not: null } },
        select: { placeId: true },
      })
      const mergedIds = [...new Set([...existingIds, ...dbPlaceIds.map(b => b.placeId!)])]
      fs.writeFileSync(historyPath, JSON.stringify({ collected_ids: mergedIds }), 'utf-8')
      console.log(`[히스토리 동기화] 기존 ${existingIds.length}개 + DB ${dbPlaceIds.length}개 → ${mergedIds.length}개`)
    } catch (e) {
      console.error('히스토리 동기화 실패:', e)
    }

    const configHex = Buffer.from(JSON.stringify({ category: searchTerm, region: region || '', target, keywords: keywords || [] }), 'utf-8').toString('hex')

    const child = exec(`python -u "${runnerPath}"`, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: scraperPath,
      encoding: 'utf-8',
      env: {
        ...process.env,
        SCRAPE_CONFIG_HEX: configHex,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
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

    // 결과 파일 → DB 저장 함수 (중간 저장 + 최종 저장 공용)
    let lastSavedCount = 0
    async function saveResultsToDB(isFinal: boolean) {
      try {
        const resultPath = `${scraperPath}/web_scrape_result.json`
        if (!fs.existsSync(resultPath)) return

        let data
        try {
          data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
        } catch {
          // Python이 파일 쓰는 중이면 JSON이 깨질 수 있음 → 다음에 다시 시도
          return
        }
        const businesses = data.businesses || []
        if (businesses.length <= lastSavedCount) return // 새로 저장할 게 없음

        // 새로 추가된 업체 중 이메일 있는 것만 DB에 저장
        const newBusinesses = businesses.slice(lastSavedCount).filter((b: { email?: string }) => b.email)
        if (newBusinesses.length === 0) { lastSavedCount = businesses.length; return }
        const placeIds = newBusinesses.map((b: { placeId?: string }) => b.placeId).filter(Boolean)
        const existingByPlace = placeIds.length > 0
          ? await prisma.business.findMany({ where: { placeId: { in: placeIds } }, select: { placeId: true } })
          : []
        const existingPlaceSet = new Set(existingByPlace.map(e => e.placeId))

        const toCreate = newBusinesses.filter((b: { placeId?: string }) =>
          !b.placeId || !existingPlaceSet.has(b.placeId)
        )
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

        lastSavedCount = businesses.length
        const withEmail = businesses.filter((b: { email?: string }) => b.email).length
        const totalSavedToDB = await prisma.business.count({
          where: { placeId: { in: businesses.map((b: { placeId?: string }) => b.placeId).filter(Boolean) as string[] } },
        })

        // 수집이력 실시간 업데이트
        // 중간 저장 시엔 status 를 건드리지 않음 — 2시간 타이머가 'failed' 로 바꾼 뒤
        // stdout 의 늦은 메시지가 와서 status='running' 으로 덮어쓰는 race condition 방지
        await prisma.scrapeJob.update({
          where: { id: job.id },
          data: {
            totalFound: businesses.length,
            totalSaved: totalSavedToDB,
            withEmail,
            ...(isFinal ? { status: 'done', finishedAt: new Date() } : {}),
          },
        })

        if (isFinal) {
          console.log(`[수집 완료] ${businesses.length}개 수집, ${toCreate.length}개 새로 저장`)
        } else {
          console.log(`[중간 저장] ${businesses.length}개 수집 중, ${toCreate.length}개 새로 저장`)
        }
      } catch (e) {
        console.error('DB 저장 오류:', e)
      }
    }

    // 2시간 백그라운드 타임아웃 — 페이지 열지 않아도 자동 종료
    const TWO_HOURS = 2 * 60 * 60 * 1000
    const timeoutId = setTimeout(async () => {
      try { if (child.pid) process.kill(child.pid, 'SIGKILL') } catch {}
      try {
        await prisma.scrapeJob.update({
          where: { id: job.id },
          data: { status: 'failed', errorMessage: '2시간 초과 자동 종료', finishedAt: new Date() },
        })
      } catch {}
      if (currentJob?.id === job.id) currentJob.status = 'failed'
    }, TWO_HOURS)

    child.stderr?.on('data', (data: string) => {
      console.error('[scraper stderr]', data.toString())
    })

    child.stdout?.on('data', (data: string) => {
      const lines = data.toString().trim().split('\n')
      for (const line of lines) {
        if (!line) continue
        try {
          const msg = JSON.parse(line)

          // 1. 새 업체 발견
          if (msg.found && currentJob) {
            currentJob.found = msg.found
            if (msg.found % 10 === 0) {
              saveResultsToDB(false)
            }
          }

          // 2. 진행 상황 (현재 키워드/지역/업체)
          if (msg.progress) {
            prisma.scrapeProgress.upsert({
              where: { jobId: job.id },
              create: {
                jobId: job.id,
                currentKeyword: msg.progress.keyword || null,
                currentRegion: msg.progress.region || null,
                currentBusiness: msg.progress.business || null,
                lastUpdate: new Date(),
              },
              update: {
                currentKeyword: msg.progress.keyword || null,
                currentRegion: msg.progress.region || null,
                currentBusiness: msg.progress.business || null,
                lastUpdate: new Date(),
              },
            }).catch(() => {})
          }

          // 3. 스킵 로그
          if (msg.skipped) {
            prisma.scrapeSkipLog.create({
              data: {
                jobId: job.id,
                region: msg.skipped.region || '',
                keyword: msg.skipped.keyword || '',
                businessName: msg.skipped.business || null,
                reason: msg.skipped.reason || 'unknown',
              },
            }).catch(() => {})
            // ScrapeProgress의 totalSkipped 증가
            prisma.scrapeProgress.update({
              where: { jobId: job.id },
              data: { totalSkipped: { increment: 1 }, lastUpdate: new Date() },
            }).catch(() => {})
          }

          if (msg.done && currentJob) {
            currentJob.status = 'done'
          }
        } catch {}
      }
    })

    child.on('exit', async (code) => {
      clearTimeout(timeoutId)
      if (currentJob) {
        currentJob.status = code === 0 ? 'done' : 'failed'
      }
      // 최종 DB 저장
      try {
        await saveResultsToDB(true)
      } catch (e: unknown) {
        console.error('최종 DB 업로드 실패:', e)
      }

      // 최종 상태 확정 — 결과 파일 누락/빈 결과로 saveResultsToDB가 업데이트를
      // 건너뛴 경우에도 running 상태가 남지 않도록 안전장치
      try {
        const cur = await prisma.scrapeJob.findUnique({
          where: { id: job.id },
          select: { status: true },
        })
        if (cur && (cur.status === 'running' || cur.status === 'pending')) {
          await prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: code === 0 ? 'done' : 'failed',
              errorMessage: code === 0 ? null : `프로세스 종료 (code=${code})`,
              finishedAt: new Date(),
            },
          })
        }
      } catch (e) {
        console.error('[scrape] 최종 상태 확정 실패:', e)
      }

      // 큐에 다음 작업이 있으면 자동 시작 — 비어있으면 자동 모드 검사 후 다음 시도
      processNextInQueue()
      if (scrapeQueue.length === 0) {
        await maybeAutoFillQueue()
        processNextInQueue()
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
            const emails = businesses.map((b: { email?: string }) => b.email).filter(Boolean)
            const existingByPlace = placeIds.length > 0
              ? await prisma.business.findMany({ where: { placeId: { in: placeIds } }, select: { placeId: true } })
              : []
            const existingByEmail = emails.length > 0
              ? await prisma.business.findMany({ where: { email: { in: emails } }, select: { email: true } })
              : []
            const existingPlaceSet = new Set(existingByPlace.map(e => e.placeId))
            const existingEmailSet = new Set(existingByEmail.map(e => e.email))
            const toCreate = businesses.filter((b: { placeId?: string; email?: string }) =>
              (!b.placeId || !existingPlaceSet.has(b.placeId)) && (!b.email || !existingEmailSet.has(b.email))
            )

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

// 큐에서 다음 작업 자동 시작 — POST 핸들러와 동일하게 진행률/스킵 로그/중간 저장 지원
async function processNextInQueue() {
  if (scrapeQueue.length === 0) return
  if (currentJob?.status === 'running') return

  const maybeNext = scrapeQueue.shift()
  if (!maybeNext) return
  const next: QueueItem = maybeNext

  console.log(`[큐] 다음 작업 시작: ${next.category} / ${next.region || '전국'}`)

  try {
    await prisma.scrapeJob.update({
      where: { id: next.id },
      data: { status: 'running', startedAt: new Date() },
    })

    const scraperPath = process.env.SCRAPER_PATH || 'C:/Users/a/naver_place_scraper'
    const runnerPath = path.join(scraperPath, 'web_scrape_runner.py').replace(/\\/g, '/')
    const configHex = Buffer.from(JSON.stringify({ category: next.category, region: next.region, target: next.target, keywords: [] }), 'utf-8').toString('hex')

    const child = exec(`python -u "${runnerPath}"`, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: scraperPath,
      encoding: 'utf-8',
      env: {
        ...process.env,
        SCRAPE_CONFIG_HEX: configHex,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    })

    currentJob = {
      id: next.id,
      pid: child.pid || null,
      status: 'running',
      found: 0,
      target: next.target,
      category: next.category,
      region: next.region || '전국',
      mode: 'local',
    }

    // 결과 파일 → DB 저장 (POST 핸들러와 동일 로직, next.id 기준)
    let lastSavedCount = 0
    async function saveResultsToDB(isFinal: boolean) {
      try {
        const resultPath = `${scraperPath}/web_scrape_result.json`
        if (!fs.existsSync(resultPath)) return

        let data
        try {
          data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
        } catch {
          return
        }
        const businesses = data.businesses || []
        if (!isFinal && businesses.length <= lastSavedCount) return

        const newBusinesses = businesses.slice(lastSavedCount).filter((b: { email?: string }) => b.email)
        if (newBusinesses.length > 0) {
          const placeIds = newBusinesses.map((b: { placeId?: string }) => b.placeId).filter(Boolean)
          const existingByPlace = placeIds.length > 0
            ? await prisma.business.findMany({ where: { placeId: { in: placeIds } }, select: { placeId: true } })
            : []
          const existingPlaceSet = new Set(existingByPlace.map(e => e.placeId))
          const toCreate = newBusinesses.filter((b: { placeId?: string }) =>
            !b.placeId || !existingPlaceSet.has(b.placeId)
          )
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
        }
        lastSavedCount = businesses.length

        const withEmail = businesses.filter((b: { email?: string }) => b.email).length
        const allPlaceIds = businesses.map((b: { placeId?: string }) => b.placeId).filter(Boolean) as string[]
        const totalSavedToDB = allPlaceIds.length > 0
          ? await prisma.business.count({ where: { placeId: { in: allPlaceIds } } })
          : 0

        // 중간 저장 시엔 status 를 건드리지 않음 — 타이머가 'failed' 로 바꾼 뒤
        // 늦은 stdout 메시지로 status='running' 으로 덮어쓰는 race condition 방지
        await prisma.scrapeJob.update({
          where: { id: next.id },
          data: {
            totalFound: businesses.length,
            totalSaved: totalSavedToDB,
            withEmail,
            ...(isFinal ? { status: 'done', finishedAt: new Date() } : {}),
          },
        })

        if (isFinal) {
          console.log(`[큐 수집 완료] ${next.category}: ${businesses.length}개 발견, ${totalSavedToDB}개 저장`)
        }
      } catch (e) {
        console.error('[큐] DB 저장 오류:', e)
      }
    }

    // 2시간 백그라운드 타임아웃 — 페이지 열지 않아도 자동 종료
    const TWO_HOURS = 2 * 60 * 60 * 1000
    const timeoutId = setTimeout(async () => {
      try { if (child.pid) process.kill(child.pid, 'SIGKILL') } catch {}
      try {
        await prisma.scrapeJob.update({
          where: { id: next.id },
          data: { status: 'failed', errorMessage: '2시간 초과 자동 종료', finishedAt: new Date() },
        })
      } catch {}
      if (currentJob?.id === next.id) currentJob.status = 'failed'
    }, TWO_HOURS)

    child.stderr?.on('data', (data: string) => {
      console.error('[scraper stderr]', data.toString())
    })

    child.stdout?.on('data', (data: string) => {
      const lines = data.toString().trim().split('\n')
      for (const line of lines) {
        if (!line) continue
        try {
          const msg = JSON.parse(line)

          if (msg.found && currentJob) {
            currentJob.found = msg.found
            if (msg.found % 10 === 0) saveResultsToDB(false)
          }

          if (msg.progress) {
            prisma.scrapeProgress.upsert({
              where: { jobId: next.id },
              create: {
                jobId: next.id,
                currentKeyword: msg.progress.keyword || null,
                currentRegion: msg.progress.region || null,
                currentBusiness: msg.progress.business || null,
                lastUpdate: new Date(),
              },
              update: {
                currentKeyword: msg.progress.keyword || null,
                currentRegion: msg.progress.region || null,
                currentBusiness: msg.progress.business || null,
                lastUpdate: new Date(),
              },
            }).catch(() => {})
          }

          if (msg.skipped) {
            prisma.scrapeSkipLog.create({
              data: {
                jobId: next.id,
                region: msg.skipped.region || '',
                keyword: msg.skipped.keyword || '',
                businessName: msg.skipped.business || null,
                reason: msg.skipped.reason || 'unknown',
              },
            }).catch(() => {})
            prisma.scrapeProgress.update({
              where: { jobId: next.id },
              data: { totalSkipped: { increment: 1 }, lastUpdate: new Date() },
            }).catch(() => {})
          }

          if (msg.done && currentJob) currentJob.status = 'done'
        } catch {}
      }
    })

    child.on('exit', async (code) => {
      clearTimeout(timeoutId)
      if (currentJob) currentJob.status = code === 0 ? 'done' : 'failed'
      try {
        await saveResultsToDB(true)
      } catch (e) {
        console.error('[큐] 최종 DB 업로드 실패:', e)
      }

      // 최종 상태 확정 — 결과 파일 누락/빈 결과여도 running 상태가 남지 않도록
      try {
        const cur = await prisma.scrapeJob.findUnique({
          where: { id: next.id },
          select: { status: true },
        })
        if (cur && (cur.status === 'running' || cur.status === 'pending')) {
          await prisma.scrapeJob.update({
            where: { id: next.id },
            data: {
              status: code === 0 ? 'done' : 'failed',
              errorMessage: code === 0 ? null : `프로세스 종료 (code=${code})`,
              finishedAt: new Date(),
            },
          })
        }
      } catch (e) {
        console.error('[scrape-queue] 최종 상태 확정 실패:', e)
      }

      processNextInQueue()
      if (scrapeQueue.length === 0) {
        await maybeAutoFillQueue()
        processNextInQueue()
      }
    })
  } catch (e) {
    console.error('큐 작업 시작 실패:', e)
    processNextInQueue()
  }
}

// GET: 현재 작업 상태 조회
export async function GET() {
  const mode = SCRAPER_API_URL ? 'remote' : 'local'
  let scraperOnline = false

  if (SCRAPER_API_URL) {
    try {
      const res = await fetch(`${SCRAPER_API_URL}/`, { signal: AbortSignal.timeout(3000) })
      scraperOnline = res.ok
    } catch {}
  }

  // "진행중" 상태가 2시간 이상이면 자동으로 실패 처리
  if (currentJob?.status === 'running' && currentJob.id) {
    try {
      const job = await prisma.scrapeJob.findUnique({ where: { id: currentJob.id }, select: { startedAt: true } })
      if (job?.startedAt) {
        const elapsed = Date.now() - new Date(job.startedAt).getTime()
        const TWO_HOURS = 2 * 60 * 60 * 1000
        if (elapsed > TWO_HOURS) {
          await prisma.scrapeJob.update({
            where: { id: currentJob.id },
            data: { status: 'failed', errorMessage: '2시간 초과 자동 종료', finishedAt: new Date() },
          })
          currentJob.status = 'failed'
          currentJob = null
        }
      }
    } catch {}
  }

  // 30분 이상 running 인 좀비 작업 자동 정리 — currentJob 유무와 무관하게 항상 체크
  // (현재 실제 돌고 있는 currentJob.id 는 정리 대상에서 제외)
  try {
    const stuckJobs = await prisma.scrapeJob.updateMany({
      where: {
        status: 'running',
        startedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
        ...(currentJob?.id ? { NOT: { id: currentJob.id } } : {}),
      },
      data: { status: 'failed', errorMessage: '프로세스 종료됨 (자동 정리)', finishedAt: new Date() },
    })
    if (stuckJobs.count > 0) {
      console.log(`[자동 정리] 멈춘 작업 ${stuckJobs.count}건 실패 처리`)
    }
  } catch {}

  return NextResponse.json({
    job: currentJob,
    mode,
    scraperOnline,
    queue: scrapeQueue.map(q => ({ id: q.id, category: q.category, region: q.region, target: q.target, status: q.status })),
    queueLength: scrapeQueue.length,
  })
}

// PUT: 수집 중지 + 히스토리 리셋
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const action = body.action // 'stop' | 'resetHistory'

  if (action === 'stop') {
    // 수집 중지: Python 프로세스 kill
    if (currentJob?.pid) {
      try {
        process.kill(currentJob.pid)
      } catch {}
    }
    if (currentJob?.id) {
      try {
        await prisma.scrapeJob.update({
          where: { id: currentJob.id },
          data: { status: 'failed', errorMessage: '사용자가 중지함', finishedAt: new Date() },
        })
      } catch {}
    }
    currentJob = null
    return NextResponse.json({ ok: true, message: '수집 중지됨' })
  }

  if (action === 'resetHistory') {
    // 히스토리 파일 리셋
    const scraperPath = process.env.SCRAPER_PATH || 'C:/Users/a/naver_place_scraper'
    const historyPath = path.join(scraperPath, 'collected_history.json').replace(/\\/g, '/')
    try {
      fs.writeFileSync(historyPath, JSON.stringify({ collected_ids: [] }), 'utf-8')
      return NextResponse.json({ ok: true, message: '히스토리 리셋됨' })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action 필요 (stop | resetHistory)' }, { status: 400 })
}

// DELETE: 대기열 비우기
export async function DELETE() {
  const count = scrapeQueue.length
  // DB에서도 pending 상태 정리
  for (const q of scrapeQueue) {
    try {
      await prisma.scrapeJob.update({
        where: { id: q.id },
        data: { status: 'failed', errorMessage: '대기열에서 제거됨', finishedAt: new Date() },
      })
    } catch {}
  }
  scrapeQueue.length = 0
  return NextResponse.json({ cleared: count })
}
