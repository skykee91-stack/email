// 발송 내역 CSV 다운로드
// - 고객: 본인 테넌트 발송만
// - 어드민: 기본 전체, tenantId 쿼리로 특정 테넌트 선택 가능
// - 기간 필터: from/to (ISO date, default = 전체)

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const tenantIdParam = searchParams.get('tenantId')
    const campaignIdParam = searchParams.get('campaignId')

    // 어드민은 tenantId 쿼리로 특정 테넌트 필터 가능, 고객은 본인 테넌트 강제
    let tenantFilter: { tenantId?: string } = {}
    if (ctx.isAdmin) {
      if (tenantIdParam) tenantFilter = { tenantId: tenantIdParam }
    } else if (ctx.tenantId) {
      tenantFilter = { tenantId: ctx.tenantId }
    } else {
      return NextResponse.json({ error: 'No tenant' }, { status: 403 })
    }

    // 캠페인 필터 — 지정되면 해당 주문의 1~4차 전부
    const campaignFilter = campaignIdParam ? { campaignId: campaignIdParam } : {}

    // 기간 필터
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z')

    const sends = await prisma.emailSend.findMany({
      where: {
        ...tenantFilter,
        ...campaignFilter,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        business: {
          select: { name: true, email: true, category: true, region: true, phone: true },
        },
        template: {
          select: { name: true, category: true, subject: true },
        },
        campaign: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 파일명 — 테넌트명 + 캠페인명 포함
    let tenantLabel = 'all'
    if (tenantFilter.tenantId) {
      const t = await prisma.tenant.findUnique({
        where: { id: tenantFilter.tenantId },
        select: { companyName: true },
      })
      tenantLabel = t?.companyName || tenantFilter.tenantId
    }
    let campaignLabel = ''
    if (campaignIdParam) {
      const c = await prisma.campaign.findUnique({
        where: { id: campaignIdParam },
        select: { name: true },
      })
      if (c) campaignLabel = `_${c.name}`
    }
    const today = new Date().toISOString().slice(0, 10)
    const filename = `발송내역_${tenantLabel}${campaignLabel}_${today}.csv`
      .replace(/[^\w가-힣.\-_]/g, '_')

    // CSV 헤더
    const headers = [
      '캠페인',
      '발송일시',
      '수신자 업체명',
      '수신자 이메일',
      '업종',
      '지역',
      '전화번호',
      '차수',
      '템플릿명',
      '제목',
      '상태',
      '도달일시',
      '열람일시',
      '열람횟수',
      '클릭일시',
      '클릭횟수',
      '답장일시',
      '반송사유',
    ].join(',')

    const rows = sends.map((s) => {
      const row = [
        (s as { campaign?: { name: string } | null }).campaign?.name || '',
        s.createdAt ? new Date(s.createdAt).toLocaleString('ko-KR') : '',
        s.business?.name || '',
        s.business?.email || '',
        s.business?.category || '',
        s.business?.region || '',
        s.business?.phone || '',
        String(s.step),
        s.template?.name || '',
        s.renderedSubject || s.template?.subject || '',
        koStatus(s.status),
        s.deliveredAt ? new Date(s.deliveredAt).toLocaleString('ko-KR') : '',
        s.openedAt ? new Date(s.openedAt).toLocaleString('ko-KR') : '',
        String(s.openCount),
        s.clickedAt ? new Date(s.clickedAt).toLocaleString('ko-KR') : '',
        String(s.clickCount),
        s.repliedAt ? new Date(s.repliedAt).toLocaleString('ko-KR') : '',
        s.bounceReason || '',
      ]
      return row
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    })

    // UTF-8 BOM + CSV (엑셀에서 한글 정상 열림)
    const csv = '\uFEFF' + headers + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: '내보내기 실패', detail: String(error) },
      { status: 500 }
    )
  }
}

function koStatus(status: string): string {
  const map: Record<string, string> = {
    queued: '대기',
    sent: '발송',
    delivered: '도달',
    bounced: '반송',
    failed: '실패',
  }
  return map[status] || status
}
