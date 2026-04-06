// 프리셋 템플릿 등록 API
// POST /api/templates/presets?campaign=셀포 → 셀포 1~4차 템플릿 일괄 등록

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { SELLPO_STEP1_SUBJECT, SELLPO_STEP1_HTML } from '@/lib/email/templates/sellpo-step1'
import { SELLPO_STEP2_SUBJECT, SELLPO_STEP2_HTML } from '@/lib/email/templates/sellpo-step2'
import { SELLPO_STEP3_SUBJECT, SELLPO_STEP3_HTML } from '@/lib/email/templates/sellpo-step3'
import { SELLPO_STEP4_SUBJECT, SELLPO_STEP4_HTML } from '@/lib/email/templates/sellpo-step4'
import { P1COAT_STEP1_SUBJECT, P1COAT_STEP1_HTML } from '@/lib/email/templates/p1coat-step1'
import { P1COAT_STEP2_SUBJECT, P1COAT_STEP2_HTML } from '@/lib/email/templates/p1coat-step2'
import { P1COAT_STEP3_SUBJECT, P1COAT_STEP3_HTML } from '@/lib/email/templates/p1coat-step3'
import { P1COAT_STEP4_SUBJECT, P1COAT_STEP4_HTML } from '@/lib/email/templates/p1coat-step4'

const PRESETS: Record<string, { name: string; step: number; subject: string; htmlBody: string }[]> = {
  '셀포': [
    { name: '셀포 - 1차 제안서', step: 1, subject: SELLPO_STEP1_SUBJECT, htmlBody: SELLPO_STEP1_HTML },
    { name: '셀포 - 2차 후기공유', step: 2, subject: SELLPO_STEP2_SUBJECT, htmlBody: SELLPO_STEP2_HTML },
    { name: '셀포 - 3차 비교표', step: 3, subject: SELLPO_STEP3_SUBJECT, htmlBody: SELLPO_STEP3_HTML },
    { name: '셀포 - 4차 마지막', step: 4, subject: SELLPO_STEP4_SUBJECT, htmlBody: SELLPO_STEP4_HTML },
  ],
  '피원코팅즈': [
    { name: '피원코팅즈 - 1차 대리점모집', step: 1, subject: P1COAT_STEP1_SUBJECT, htmlBody: P1COAT_STEP1_HTML },
    { name: '피원코팅즈 - 2차 기술비교', step: 2, subject: P1COAT_STEP2_SUBJECT, htmlBody: P1COAT_STEP2_HTML },
    { name: '피원코팅즈 - 3차 수익성', step: 3, subject: P1COAT_STEP3_SUBJECT, htmlBody: P1COAT_STEP3_HTML },
    { name: '피원코팅즈 - 4차 마지막', step: 4, subject: P1COAT_STEP4_SUBJECT, htmlBody: P1COAT_STEP4_HTML },
  ],
}

export async function GET() {
  return NextResponse.json({ available: Object.keys(PRESETS) })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaign = searchParams.get('campaign')

  if (!campaign || !PRESETS[campaign]) {
    return NextResponse.json({ error: `사용 가능: ${Object.keys(PRESETS).join(', ')}` }, { status: 400 })
  }

  const templates = []
  for (const preset of PRESETS[campaign]) {
    const template = await prisma.emailTemplate.create({
      data: { ...preset, category: campaign },
    })
    templates.push(template)
  }

  return NextResponse.json({ message: `${campaign} 템플릿 ${templates.length}개 등록 완료`, templates })
}
