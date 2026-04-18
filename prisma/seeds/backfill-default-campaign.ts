// 기존 EmailSend (campaignId = null) 을 각 테넌트의 "기본 캠페인" 으로 이관
// 이미 이관된 경우 재실행해도 안전 (upsert)

import { PrismaClient } from '../../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log('🚀 기본 캠페인 이관 시작...')

  // 모든 테넌트마다 기본 캠페인 하나씩 만들고 null campaignId 인 send 들을 연결
  const tenants = await prisma.tenant.findMany()

  for (const tenant of tenants) {
    // 기본 캠페인 upsert
    const defaultCampaignId = `${tenant.id}-default`
    const campaign = await prisma.campaign.upsert({
      where: { id: defaultCampaignId },
      update: {},
      create: {
        id: defaultCampaignId,
        tenantId: tenant.id,
        name: '기본 캠페인 (이관)',
        description: `${tenant.companyName} 의 기존 발송 내역 이관용`,
        targetTotal: 999999, // 무제한
        status: 'active',
      },
    })

    // 해당 테넌트의 campaignId = null 인 EmailSend 전부 이관
    const nullSends = await prisma.emailSend.count({
      where: { tenantId: tenant.id, campaignId: null },
    })

    if (nullSends > 0) {
      const updated = await prisma.emailSend.updateMany({
        where: { tenantId: tenant.id, campaignId: null },
        data: { campaignId: campaign.id },
      })
      // currentTotal 반영
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { currentTotal: { increment: updated.count } },
      })
      console.log(`✓ [${tenant.companyName}] ${updated.count}건 → "${campaign.name}"`)
    } else {
      console.log(`- [${tenant.companyName}] 이관할 데이터 없음`)
    }
  }

  // tenantId 도 campaignId 도 없는 외톨이 레코드 체크
  const orphans = await prisma.emailSend.count({ where: { tenantId: null, campaignId: null } })
  if (orphans > 0) {
    console.warn(`⚠️ tenantId/campaignId 둘 다 없는 레코드: ${orphans}건 (수동 처리 필요)`)
  }

  const totalCampaigns = await prisma.campaign.count()
  const nullCampaignSends = await prisma.emailSend.count({ where: { campaignId: null } })
  console.log(`\n🎉 완료! 전체 캠페인: ${totalCampaigns}, 아직 캠페인 없는 send: ${nullCampaignSends}`)
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
