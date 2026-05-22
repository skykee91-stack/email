"use client";
import { useState, useEffect, Fragment } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [tierCounts, setTierCounts] = useState({ S: 0, A: 0, B: 0, C: 0 });
  const [filterTier, setFilterTier] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeads = async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (filterTier) params.set("tier", filterTier);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTierCounts(data.tierCounts || { S: 0, A: 0, B: 0, C: 0 });
  };

  useEffect(() => { fetchLeads(); }, [filterTier]);

  const recalculate = async () => {
    setRecalculating(true);
    await fetch("/api/leads", { method: "POST" });
    await fetchLeads();
    setRecalculating(false);
  };

  const tierColors: Record<string, string> = {
    S: "bg-red-500/20 text-red-400 border-red-500",
    A: "bg-orange-500/20 text-orange-400 border-orange-500",
    B: "bg-blue-500/20 text-blue-400 border-blue-500",
    C: "bg-gray-500/20 text-gray-400 border-gray-500",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">핫 리드</h1>
          <p className="text-gray-400 mt-1">관심도 높은 업체 순위</p>
        </div>
        <button onClick={recalculate} disabled={recalculating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {recalculating ? "계산 중..." : "점수 재계산"}
        </button>
      </div>

      {/* 티어 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(["S", "A", "B", "C"] as const).map(tier => (
          <button key={tier} onClick={() => setFilterTier(filterTier === tier ? "" : tier)}
            className={`p-4 rounded-lg border text-center transition-colors ${
              filterTier === tier ? tierColors[tier] + " border-opacity-100" : "bg-gray-900 border-gray-800 hover:border-gray-600"
            }`}>
            <p className={`text-2xl font-bold ${filterTier === tier ? "" : "text-white"}`}>{tierCounts[tier]}</p>
            <p className="text-xs text-gray-500 mt-1">
              {tier === "S" ? "즉시 연락" : tier === "A" ? "개인화 팔로업" : tier === "B" ? "자동 팔로업" : "관심 없음"}
            </p>
            <p className={`text-lg font-bold mt-1 ${filterTier === tier ? "" : "text-gray-400"}`}>{tier}</p>
          </button>
        ))}
      </div>

      {/* 리드 테이블 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400">순위</th>
              <th className="text-left px-4 py-3 text-gray-400">티어</th>
              <th className="text-left px-4 py-3 text-gray-400">업체명</th>
              <th className="text-left px-4 py-3 text-gray-400">업종</th>
              <th className="text-right px-4 py-3 text-gray-400">점수</th>
              <th className="text-right px-4 py-3 text-gray-400">열람</th>
              <th className="text-right px-4 py-3 text-gray-400">클릭</th>
              <th className="text-center px-4 py-3 text-gray-400">답장</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">핫 리드 데이터가 없습니다</td></tr>
            ) : leads.map((lead, i) => {
              const sends = lead.business?.emailSends || [];
              const isOpen = expandedId === lead.id;
              return (
                <Fragment key={lead.id}>
                  <tr
                    className="border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => setExpandedId(isOpen ? null : lead.id)}
                    title="클릭하면 발송 이력 펼침"
                  >
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${tierColors[lead.tier]}`}>{lead.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      <span className="mr-2 text-gray-500 text-xs">{isOpen ? "▼" : "▶"}</span>
                      {lead.business?.name}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{lead.business?.category || "-"}</td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-bold">{lead.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{lead.totalOpens}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{lead.totalClicks}</td>
                    <td className="px-4 py-3 text-center">{lead.hasReplied ? "✅" : "-"}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-gray-800/30">
                      <td colSpan={8} className="px-6 py-3">
                        {sends.length === 0 ? (
                          <p className="text-xs text-gray-500">발송 이력이 없습니다</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 mb-2">발송 이력 (최근순)</p>
                            {sends.map((s: any, idx: number) => {
                              const cat = s.template?.category || "기본";
                              const date = s.sentAt ? new Date(s.sentAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "-";
                              return (
                                <div key={idx} className="text-xs flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-medium">{cat}</span>
                                  <span className="text-gray-400">{s.step}차</span>
                                  <span className="text-gray-300">열람 <b className="text-white">{s.openCount}</b></span>
                                  <span className="text-gray-300">클릭 <b className="text-white">{s.clickCount}</b></span>
                                  {s.repliedAt && <span className="text-green-400">✅ 답장</span>}
                                  <span className="text-gray-500 ml-auto">{date}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
