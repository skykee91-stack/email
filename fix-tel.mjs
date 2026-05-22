// DB의 마스터인사이트(블로그) 템플릿 4개에서 tel: 형식 일괄 치환 + 확인
import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

try {
  const count = await prisma.$executeRaw`
    UPDATE "EmailTemplate"
    SET "htmlBody" = REPLACE("htmlBody", 'tel:01056106023', 'tel:+82-10-5610-6023')
    WHERE category = '마스터인사이트(블로그)'
  `
  console.log(`✅ DB 업데이트: ${count} rows`)

  const rows = await prisma.emailTemplate.findMany({
    where: { category: '마스터인사이트(블로그)' },
    select: { name: true, htmlBody: true },
    orderBy: { step: 'asc' },
  })
  console.log(`=== 확인 ===`)
  for (const r of rows) {
    const m = r.htmlBody.match(/tel:[+0-9-]+/)
    console.log(`  ${r.name} → ${m ? m[0] : 'tel: 없음'}`)
  }
} catch (err) {
  console.error(`❌ 실패: ${err.message}`)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
