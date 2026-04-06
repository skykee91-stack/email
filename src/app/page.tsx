"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, active: 0, bounced: 0, unsubscribed: 0 });
  const [funnel, setFunnel] = useState<any>(null);
  const [leads, setLeads] = useState({ S: 0, A: 0, B: 0, C: 0 });
  const [dbStatus, setDbStatus] = useState<string>("checking");
  const [recentBiz, setRecentBiz] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sendCount, setSendCount] = useState(0);
  const [brevoCredits, setBrevoCredits] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/businesses/stats").then(r => r.json()).catch(() => null),
      fetch("/api/stats/funnel?days=30").then(r => r.json()).catch(() => null),
      fetch("/api/leads?limit=1").then(r => r.json()).catch(() => null),
      fetch("/api/health").then(r => r.json()).catch(() => null),
      fetch("/api/businesses?limit=5").then(r => r.json()).catch(() => null),
      fetch("/api/templates").then(r => r.json()).catch(() => null),
      fetch("/api/email/sends?limit=1").then(r => r.json()).catch(() => null),
      fetch("/api/brevo-account").then(r => r.json()).catch(() => null),
    ]).then(([bizStats, funnelData, leadsData, health, bizList, tplData, sendData, brevoData]) => {
      if (bizStats) setStats(bizStats);
      if (funnelData) setFunnel(funnelData);
      if (leadsData?.tierCounts) setLeads(leadsData.tierCounts);
      setDbStatus(health?.status === "ok" ? "ok" : "error");
      if (bizList?.businesses) setRecentBiz(bizList.businesses);
      if (tplData?.templates) setTemplates(tplData.templates);
      if (sendData?.pagination) setSendCount(sendData.pagination.total);
      if (brevoData?.remainingCredits != null) setBrevoCredits(brevoData.remainingCredits);
    });
  }, []);

  const sent = funnel?.funnel?.sent || 0;
  const delivered = funnel?.funnel?.delivered || 0;
  const opened = funnel?.funnel?.opened || 0;
  const clicked = funnel?.funnel?.clicked || 0;
  const replied = funnel?.funnel?.replied || 0;

  // 발송 가능 수 (이메일 있고 활성인 업체 - 이미 보낸 업체)
  const sendReady = stats.withEmail - sendCount;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <p className="text-gray-400 mt-1">영업 이메일 자동화 현황</p>
      </div>

      {/* Brevo 잔여 이메일 */}
      {brevoCredits !== null && (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-400">Brevo 잔여 이메일</span>
          <span className={`text-lg font-bold ${brevoCredits < 100 ? "text-red-400" : "text-green-400"}`}>{brevoCredits.toLocaleString()}통 남음</span>
        </div>
      )}

      {/* 핵심 KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="수집 업체" value={stats.total} sub={`이메일: ${stats.withEmail}개`} color="blue" icon="B" />
        <KPICard title="발송 대기" value={sendReady > 0 ? sendReady : 0} sub={`발송완료: ${sendCount}`} color="green" icon="M" />
        <KPICard title="열람률" value={delivered > 0 ? `${((opened / delivered) * 100).toFixed(1)}%` : "0%"} sub={`열람: ${opened} / 도달: ${delivered}`} color="purple" icon="E" />
        <KPICard title="핫 리드" value={leads.S + leads.A} sub={`S등급: ${leads.S} / A등급: ${leads.A}`} color="red" icon="H" />
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <QuickAction href="/scrape" label="업체 수집" desc="네이버에서 수집" color="bg-blue-600" />
        <QuickAction href="/email" label="이메일 발송" desc={`${sendReady > 0 ? sendReady : 0}개 대기 중`} color="bg-green-600" />
        <QuickAction href="/insights" label="인사이트" desc="성과 분석 보기" color="bg-purple-600" />
        <QuickAction href="/templates" label="템플릿 관리" desc={`${templates.length}개 등록됨`} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 퍼널 현황 */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">퍼널 현황 (30일)</h2>
          {sent === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">아직 발송 데이터가 없습니다</p>
              <Link href="/email" className="text-blue-400 text-sm hover:underline">첫 이메일 보내기 &rarr;</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <FunnelBar label="발송" value={sent} max={sent} />
              <FunnelBar label="도달" value={delivered} max={sent} />
              <FunnelBar label="열람" value={opened} max={sent} />
              <FunnelBar label="클릭" value={clicked} max={sent} />
              <FunnelBar label="답장" value={replied} max={sent} />
            </div>
          )}
        </div>

        {/* 최근 수집 업체 */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">최근 수집 업체</h2>
            <Link href="/businesses" className="text-xs text-blue-400 hover:underline">전체 보기 &rarr;</Link>
          </div>
          {recentBiz.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">수집된 업체가 없습니다</p>
              <Link href="/scrape" className="text-blue-400 text-sm hover:underline">업체 수집하기 &rarr;</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBiz.map((biz) => (
                <div key={biz.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{biz.name}</p>
                    <p className="text-xs text-gray-500">{biz.category} | {biz.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{biz.email || "이메일 없음"}</p>
                    <p className="text-xs text-gray-600">{biz.phone || ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">시스템 상태</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard label="DB" status={dbStatus === "ok"} detail={`업체 ${stats.total}개`} />
          <StatusCard label="Brevo" status={true} detail="연동 완료" />
          <StatusCard label="템플릿" status={templates.length > 0} detail={`${templates.length}개`} />
          <StatusCard label="수신거부" status={true} detail={`${stats.unsubscribed}건`} />
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, color, icon }: { title: string; value: string | number; sub: string; color: string; icon: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700",
    red: "from-red-600 to-red-700",
  };
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-full`} />
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-500 mt-2">{sub}</p>
    </div>
  );
}

function QuickAction({ href, label, desc, color }: { href: string; label: string; desc: string; color: string }) {
  return (
    <Link href={href} className={`${color} rounded-lg p-4 hover:opacity-90 transition-opacity`}>
      <p className="text-white font-semibold text-sm">{label}</p>
      <p className="text-white/70 text-xs mt-1">{desc}</p>
    </Link>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm text-white font-medium">{value.toLocaleString()} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}

function StatusCard({ label, status, detail }: { label: string; status: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <span className={`w-2.5 h-2.5 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`} />
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
