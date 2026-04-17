// 기존 데이터를 "셀포" 테넌트로 이관 + 어드민 계정 생성
// 실행: ADMIN_INITIAL_PASSWORD='...' npx tsx prisma/seeds/migrate-existing-to-sellpo-tenant.ts

import { PrismaClient } from '../../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const SELLPO_TENANT_ID = 'sellpo-default'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'skykee91@gmail.com'

async function main() {
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (!adminPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD 환경변수 필요')
  }

  console.log('🚀 멀티테넌트 마이그레이션 시작...')

  // 1. "셀포" 테넌트 생성 (이미 있으면 유지)
  const tenant = await prisma.tenant.upsert({
    where: { id: SELLPO_TENANT_ID },
    update: {},
    create: {
      id: SELLPO_TENANT_ID,
      companyName: '셀포 (운영자 본인)',
      domain: 'sellpo.kr',
      senderEmail: 'info@sellpo.kr',
      senderName: '블로그마케팅 셀포',
      forwardTo: ADMIN_EMAIL,
      plan: 'PREMIUM',
      sendQuotaMonthly: 999999,
      setupStatus: 'ACTIVE',
    },
  })
  console.log(`✓ 테넌트: ${tenant.companyName} (${tenant.id})`)

  // 2. 어드민 계정 생성 (이미 있으면 비번 유지)
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existingAdmin) {
    console.log(`✓ 어드민 계정 이미 존재: ${ADMIN_EMAIL}`)
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10)
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: hashed,
        name: '셀포 운영자',
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    })
    console.log(`✓ 어드민 계정 생성: ${ADMIN_EMAIL}`)
  }

  // 3. 기존 데이터 tenantId 채우기 (null 인 것만)
  const results = await Promise.all([
    prisma.emailTemplate.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.emailSend.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.hotLead.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.deal.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.senderProfile.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
  ])

  console.log('✓ 기존 데이터 이관 완료:')
  console.log(`  - EmailTemplate: ${results[0].count}개`)
  console.log(`  - EmailSend: ${results[1].count}개`)
  console.log(`  - HotLead: ${results[2].count}개`)
  console.log(`  - Deal: ${results[3].count}개`)
  console.log(`  - SenderProfile: ${results[4].count}개`)

  // 4. 검증
  const verify = await Promise.all([
    prisma.emailSend.count({ where: { tenantId: null } }),
    prisma.emailTemplate.count({ where: { tenantId: null } }),
    prisma.hotLead.count({ where: { tenantId: null } }),
  ])

  if (verify[0] === 0 && verify[1] === 0 && verify[2] === 0) {
    console.log('✓ 검증 통과: 모든 레코드가 테넌트에 연결됨')
  } else {
    console.warn(`⚠️ 아직 tenantId null 인 레코드 있음:`, {
      emailSends: verify[0],
      templates: verify[1],
      hotLeads: verify[2],
    })
  }

  console.log('\n🎉 마이그레이션 완료!')
  console.log(`\n어드민 로그인 정보:`)
  console.log(`  이메일: ${ADMIN_EMAIL}`)
  console.log(`  비번: (입력하신 ADMIN_INITIAL_PASSWORD)`)
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
