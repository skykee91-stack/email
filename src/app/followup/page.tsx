"use client";
import { useState, useEffect } from "react";

export default function FollowupPage() {
  const [templates, setTemplates] = useState<{ id: string; name: string; step: number }[]>([]);
  const [candidates, setCandidates] = useState<any>(null);
  const [step, setStep] = useState(2);
  const [delayDays, setDelayDays] = useState(3);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  const checkCandidates = async () => {
    const res = await fetch(`/api/followup?step=${step}&delayDays=${delayDays}`);
    const data = await res.json();
    setCandidates(data);
  };

  const executeFollowup = async (dryRun: boolean) => {
    if (!selectedTemplate && !dryRun) { alert("템플릿을 선택하세요"); return; }
    setLoading(true);
    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, delayDays, templateId: selectedTemplate, dryRun }),
    });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">팔로업 관리</h1>
        <p className="text-gray-400 mt-1">자동 후속 이메일 발송</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">팔로업 설정</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">팔로업 단계</label>
            <select value={step} onChange={(e) => setStep(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value={2}>2차 (첫 팔로업)</option>
              <option value={3}>3차</option>
              <option value={4}>4차 (마지막)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">1차 발송 후 경과일</label>
            <input type="number" value={delayDays} onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">사용할 템플릿</label>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="">선택하세요</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={checkCandidates} className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              대상 확인
            </button>
          </div>
        </div>

        {candidates && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-2">팔로업 대상: {candidates.total}명</p>
            {candidates.candidates?.slice(0, 10).map((c: any, i: number) => (
              <p key={i} className="text-sm text-gray-400">{c.businessName} ({c.email})</p>
            ))}
            {candidates.total > 10 && <p className="text-sm text-gray-500 mt-1">... 외 {candidates.total - 10}명</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => executeFollowup(true)} disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50">
            드라이런
          </button>
          <button onClick={() => executeFollowup(false)} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "발송 중..." : "팔로업 발송"}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
