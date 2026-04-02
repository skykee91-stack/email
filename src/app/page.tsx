"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, active: 0, bounced: 0, unsubscribed: 0 });
  const [funnel, setFunnel] = useState<any>(null);
  const [leads, setLeads] = useState({ S: 0, A: 0, B: 0, C: 0 });
  const [dbStatus, setDbStatus] = useState<string>("checking");

  useEffect(() => {
    Promise.all([
      fetch("/api/businesses/stats").then(r => r.json()).catch(() => null),
      fetch("/api/stats/funnel?days=30").then(r => r.json()).catch(() => null),
      fetch("/api/leads?limit=1").then(r => r.json()).catch(() => null),
      fetch("/api/health").then(r => r.json()).catch(() => null),
    ]).then(([bizStats, funnelData, leadsData, health]) => {
      if (bizStats) setStats(bizStats);
      if (funnelData) setFunnel(funnelData);
      if (leadsData?.tierCounts) setLeads(leadsData.tierCounts);
      setDbStatus(health?.status === "ok" ? "ok" : "error");
    });
  }, []);

  const sent = funnel?.funnel?.sent || 0;
  const delivered = funnel?.funnel?.delivered || 0;
  const opened = funnel?.funnel?.opened || 0;
  const clicked = funnel?.funnel?.clicked || 0;
  const replied = funnel?.funnel?.replied || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <p className="text-gray-400 mt-1">영업 이메일 자동화 현황</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="수집 업체" value={stats.total} sub={`이메일 보유: ${stats.withEmail}`} color="blue" />
        <KPICard title="총 발송" value={sent} sub={`도달: ${delivered}`} color="purple" />
        <KPICard title="열람" value={opened} sub={delivered > 0 ? `열람률: ${((opened / delivered) * 100).toFixed(1)}%` : "0%"} color="green" />
        <KPICard title="핫 리드" value={leads.S + leads.A} sub={`S: ${leads.S} / A: ${leads.A}`} color="red" />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">퍼널 현황 (30일)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FunnelCard label="발송" value={sent} rate={null} />
          <FunnelCard label="도달" value={delivered} rate={sent > 0 ? (delivered / sent) * 100 : 0} />
          <FunnelCard label="열람" value={opened} rate={delivered > 0 ? (opened / delivered) * 100 : 0} />
          <FunnelCard label="클릭" value={clicked} rate={opened > 0 ? (clicked / opened) * 100 : 0} />
          <FunnelCard label="답장" value={replied} rate={sent > 0 ? (replied / sent) * 100 : 0} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">시스템 상태</h2>
        <div className="space-y-3">
          <StatusRow label="DB 연결" status={dbStatus === "ok" ? "ok" : dbStatus === "checking" ? "pending" : "error"}
            detail={dbStatus === "ok" ? `업체 ${stats.total}개` : dbStatus === "checking" ? "확인 중..." : "연결 실패"} />
          <StatusRow label="Brevo API" status="ok" detail="연동 완료" />
          <StatusRow label="이메일 발송" status={sent > 0 ? "ok" : "pending"} detail={sent > 0 ? `${sent}통 발송됨` : "발송 대기"} />
          <StatusRow label="수신거부 처리" status="ok" detail={`${stats.unsubscribed}건 처리됨`} />
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, color }: { title: string; value: number; sub: string; color: string }) {
  const colors: Record<string, string> = { blue: "border-blue-500", green: "border-green-500", purple: "border-purple-500", red: "border-red-500" };
  return (
    <div className={`bg-gray-900 rounded-lg border-l-4 ${colors[color]} p-5`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function FunnelCard({ label, value, rate }: { label: string; value: number; rate: number | null }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
      {rate !== null && <p className="text-xs text-gray-500 mt-1">{rate.toFixed(1)}%</p>}
    </div>
  );
}

function StatusRow({ label, status, detail }: { label: string; status: "ok" | "pending" | "error"; detail: string }) {
  const map = { ok: { dot: "bg-green-500", text: "정상" }, pending: { dot: "bg-yellow-500", text: "대기" }, error: { dot: "bg-red-500", text: "오류" } };
  const s = map[status];
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${s.dot}`} /><span className="text-sm text-white">{label}</span></div>
      <div className="flex items-center gap-3"><span className="text-xs text-gray-500">{detail}</span><span className="text-xs text-gray-400">{s.text}</span></div>
    </div>
  );
}
