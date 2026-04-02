"use client";
import { useState, useEffect } from "react";

export default function EmailPage() {
  const [templates, setTemplates] = useState<{ id: string; name: string; step: number }[]>([]);
  const [sends, setSends] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [step, setStep] = useState(1);
  const [maxCount, setMaxCount] = useState(100);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch("/api/email/sends?limit=20").then(r => r.json()).then(d => setSends(d.sends || []));
  }, []);

  const handleSend = async (dryRun: boolean) => {
    if (!selectedTemplate) { alert("템플릿을 선택하세요"); return; }
    setSending(true); setResult(null);
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: selectedTemplate, step, maxCount, dryRun,
        filters: { ...(category && { category }), ...(region && { region }) },
      }),
    });
    const data = await res.json();
    setResult(data); setSending(false);
    if (!dryRun) fetch("/api/email/sends?limit=20").then(r => r.json()).then(d => setSends(d.sends || []));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">이메일 발송</h1>
        <p className="text-gray-400 mt-1">영업 이메일 발송 관리</p>
      </div>

      {/* 발송 폼 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">새 발송</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">템플릿</label>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="">선택하세요</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.step}차)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">발송 단계</label>
            <select value={step} onChange={(e) => setStep(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value={1}>1차</option><option value={2}>2차</option>
              <option value={3}>3차</option><option value={4}>4차</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">업종 필터</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="전체" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">최대 발송 수</label>
            <input type="number" value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSend(true)} disabled={sending}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50">
            미리보기 (드라이런)
          </button>
          <button onClick={() => handleSend(false)} disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {sending ? "발송 중..." : "발송 시작"}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* 발송 이력 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-4 border-b border-gray-800">최근 발송 이력</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400">업체명</th>
              <th className="text-left px-4 py-3 text-gray-400">단계</th>
              <th className="text-left px-4 py-3 text-gray-400">상태</th>
              <th className="text-left px-4 py-3 text-gray-400">열람</th>
              <th className="text-left px-4 py-3 text-gray-400">클릭</th>
              <th className="text-left px-4 py-3 text-gray-400">발송일</th>
            </tr>
          </thead>
          <tbody>
            {sends.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">발송 이력이 없습니다</td></tr>
            ) : sends.map((s: any) => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="px-4 py-3 text-white">{s.business?.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{s.step}차</span></td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-gray-300">{s.openCount}</td>
                <td className="px-4 py-3 text-gray-300">{s.clickCount}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.sentAt ? new Date(s.sentAt).toLocaleString("ko-KR") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-gray-500/20 text-gray-400",
    sent: "bg-blue-500/20 text-blue-400",
    delivered: "bg-green-500/20 text-green-400",
    bounced: "bg-red-500/20 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[status] || "bg-gray-500/20 text-gray-400"}`}>{status}</span>;
}
