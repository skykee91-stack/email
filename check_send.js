const { PrismaClient } = require("./src/generated/prisma");
const p = new PrismaClient();
(async () => {
  try {
    const lastSent = await p.$queryRawUnsafe(`SELECT MAX("sentAt") as last FROM "SentEmail"`);
    const sent24h = await p.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "SentEmail" WHERE "sentAt" >= NOW() - INTERVAL '24 hours'`);
    const sent2h = await p.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "SentEmail" WHERE "sentAt" >= NOW() - INTERVAL '2 hours'`);
    console.log("마지막 발송:", lastSent[0].last);
    console.log("최근 24h 발송:", sent24h[0].c);
    console.log("최근 2h 발송:", sent2h[0].c);
    const tables = await p.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name ILIKE '%queue%' OR table_name ILIKE '%send%' OR table_name ILIKE '%followup%')`);
    console.log("관련 테이블:", tables.map(t=>t.table_name));
  } catch (e) { console.error("ERR:", e.message); }
  await p.$disconnect();
})();
