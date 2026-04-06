"use client";
import { useState, useEffect } from "react";

interface Template { id: string; name: string; step: number; subject: string; }
interface Profile { id: string; serviceName: string; senderName: string; senderEmail: string; isDefault: boolean; }

export default function EmailPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sends, setSends] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateB, setSelectedTemplateB] = useState(""); // A/B 테스트 B 변형
  const [abTestMode, setAbTestMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [step, setStep] = useState(1);
  const [maxCount, setMaxCount] = useState(100);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewTargets, setPreviewTargets] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch("/api/sender-profiles").then(r => r.json()).then(d => {
      setProfiles(d.profiles || []);
      const def = d.profiles?.find((p: Profile) => p.isDefault);
      if (def) setSelectedProfile(def.id);
    });
    fetchSends();
  }, []);

  const fetchSends = () => {
    fetch("/api/email/sends?limit=20").then(r => r.json()).then(d => setSends(d.sends || []));
  };

  // 템플릿 선택 시 자동으로 단계 설정
  const onTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) setStep(tpl.step);
  };

  // 드라이런 (미리보기)
  const handlePreview = async () => {
    if (!selectedTemplate) { alert("템플릿을 선택하세요"); return; }
    setSending(true); setResult(null); setPreviewTargets([]);
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: selectedTemplate, step, maxCount, dryRun: true,
        ...(abTestMode && selectedTemplateB ? { templateIdB: selectedTemplateB } : {}),
        filters: { ...(category && { category }), ...(region && { region }) },
      }),
    });
    const data = await res.json();
    setSending(false);
    if (data.dryRun) {
      setPreviewTargets(data.businesses || []);
      setShowPreview(true);
      setResult({ message: `${data.totalTargets}개 업체에 발송 가능` });
    } else {
      setResult(data);
    }
  };

  // 실제 발송
  const handleSend = async () => {
    if (!selectedTemplate) { alert("템플릿을 선택하세요"); return; }
    if (!confirm(`${previewTargets.length || maxCount}개 업체에 실제 이메일을 보냅니다. 계속하시겠습니까?`)) return;

    setSending(true); setResult(null);
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: selectedTemplate, step, maxCount, dryRun: false,
        profileId: selectedProfile || undefined,
        ...(abTestMode && selectedTemplateB ? { templateIdB: selectedTemplateB } : {}),
        filters: { ...(category && { category }), ...(region && { region }) },
      }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
    setShowPreview(false);
    fetchSends();
  };

  const selectedTpl = templates.find(t => t.id === selectedTemplate);
  const selectedProf = profiles.find(p => p.id === selectedProfile);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">이메일 발송</h1>
        <p className="text-gray-400 mt-1">영업 이메일 발송 관리</p>
      </div>

      {/* 발송 설정 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">발송 설정</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* 발신자 프로필 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">발신자 프로필</label>
            <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value="">기본 발신자</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.serviceName} ({p.senderEmail}) {p.isDefault ? "[기본]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 템플릿 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일 템플릿</label>
            <select value={selectedTemplate} onChange={e => onTemplateChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value="">선택하세요</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.step}차)</option>)}
            </select>
          </div>

          {/* A/B 테스트 토글 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">A/B 테스트</label>
            <button onClick={() => { setAbTestMode(!abTestMode); setSelectedTemplateB(""); }}
              className={`w-full px-3 py-2 rounded text-sm font-semibold ${abTestMode ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
              {abTestMode ? "A/B 테스트 ON" : "A/B 테스트 OFF"}
            </button>
          </div>

          {/* A/B 테스트 B 변형 선택 */}
          {abTestMode && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">B 변형 템플릿</label>
              <select value={selectedTemplateB} onChange={e => setSelectedTemplateB(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-orange-500/50 rounded text-white text-sm">
                <option value="">B 변형 선택</option>
                {templates.filter(t => t.id !== selectedTemplate).map(t => <option key={t.id} value={t.id}>{t.name} ({t.step}차)</option>)}
              </select>
            </div>
          )}

          {/* 발송 단계 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">발송 단계</label>
            <select value={step} onChange={e => setStep(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value={1}>1차 (첫 제안)</option>
              <option value={2}>2차 (팔로업)</option>
              <option value={3}>3차 (비교 정보)</option>
              <option value={4}>4차 (마지막)</option>
            </select>
          </div>

          {/* 업종 필터 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">업종 필터 (선택)</label>
            <input value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm" placeholder="전체 업종" />
          </div>

          {/* 지역 필터 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">지역 필터 (선택)</label>
            <input value={region} onChange={e => setRegion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm" placeholder="전체 지역" />
          </div>

          {/* 최대 발송 수 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">최대 발송 수</label>
            <select value={maxCount} onChange={e => setMaxCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value={10}>10개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
              <option value={300}>300개</option>
              <option value={500}>500개</option>
            </select>
          </div>
        </div>

        {/* 발송 요약 */}
        {selectedTpl && (
          <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">발송 요약</p>
            <p className="text-white text-sm">
              <span className="text-blue-400">{selectedProf?.serviceName || "기본"}</span>
              {" > "}
              <span className="text-green-400">[A] {selectedTpl.name}</span>
              {" > "}
              제목: (광고) {selectedTpl.subject}
            </p>
            {abTestMode && selectedTemplateB && (
              <p className="text-white text-sm mt-1">
                <span className="text-blue-400">{selectedProf?.serviceName || "기본"}</span>
                {" > "}
                <span className="text-orange-400">[B] {templates.find(t => t.id === selectedTemplateB)?.name}</span>
                {" > "}
                제목: (광고) {templates.find(t => t.id === selectedTemplateB)?.subject}
              </p>
            )}
            {abTestMode && selectedTemplateB && (
              <p className="text-xs text-orange-400 mt-2">A/B 테스트: 대상을 50:50으로 나눠서 A/B 변형을 각각 발송합니다</p>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button onClick={handlePreview} disabled={sending || !selectedTemplate}
            className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm font-semibold">
            미리보기
          </button>
          <button onClick={handleSend} disabled={sending || !selectedTemplate}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
            {sending ? "처리 중..." : "실제 발송"}
          </button>
        </div>
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg ${result.error ? "bg-red-900/30 border border-red-800 text-red-400" : "bg-green-900/30 border border-green-800 text-green-400"}`}>
          {result.message || result.error || (
            result.abTest ? (
              <div>
                <p>A/B 테스트 발송 완료 (총 {result.sent || 0}건)</p>
                <p className="text-sm mt-1">[A] {result.groupA?.sent || 0}건 발송, {result.groupA?.skipped || 0}건 건너뜀</p>
                <p className="text-sm">[B] {result.groupB?.sent || 0}건 발송, {result.groupB?.skipped || 0}건 건너뜀</p>
                <p className="text-xs mt-2 text-gray-400">인사이트 페이지에서 A/B 성과를 비교하세요</p>
              </div>
            ) : `발송: ${result.sent || 0}건, 건너뛰기: ${result.skipped || 0}건`
          )}
        </div>
      )}

      {/* 미리보기 대상 목록 */}
      {showPreview && previewTargets.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">발송 대상 ({previewTargets.length}개)</h2>
            <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-white">닫기</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-3 py-2 text-gray-400">#</th>
                  <th className="text-left px-3 py-2 text-gray-400">업체명</th>
                  <th className="text-left px-3 py-2 text-gray-400">이메일</th>
                  <th className="text-left px-3 py-2 text-gray-400">업종</th>
                  <th className="text-left px-3 py-2 text-gray-400">지역</th>
                </tr>
              </thead>
              <tbody>
                {previewTargets.map((biz: any, i: number) => (
                  <tr key={biz.id} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-white">{biz.name}</td>
                    <td className="px-3 py-2 text-gray-300">{biz.email}</td>
                    <td className="px-3 py-2 text-gray-400">{biz.category || "-"}</td>
                    <td className="px-3 py-2 text-gray-400">{biz.region || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 발송 이력 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-4 border-b border-gray-800">최근 발송 이력</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400">업체명</th>
              <th className="text-left px-4 py-3 text-gray-400">이메일</th>
              <th className="text-left px-4 py-3 text-gray-400">단계</th>
              <th className="text-left px-4 py-3 text-gray-400">상태</th>
              <th className="text-left px-4 py-3 text-gray-400">열람</th>
              <th className="text-left px-4 py-3 text-gray-400">발송일</th>
            </tr>
          </thead>
          <tbody>
            {sends.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">발송 이력이 없습니다</td></tr>
            ) : sends.map((s: any) => (
              <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white">{s.business?.name}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{s.business?.email || "-"}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{s.step}차</span></td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-gray-300">{s.openCount || 0}</td>
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
  const map: Record<string, { bg: string; label: string }> = {
    queued: { bg: "bg-gray-500/20 text-gray-400", label: "대기" },
    sent: { bg: "bg-blue-500/20 text-blue-400", label: "발송됨" },
    delivered: { bg: "bg-green-500/20 text-green-400", label: "도달" },
    bounced: { bg: "bg-red-500/20 text-red-400", label: "반송" },
  };
  const s = map[status] || { bg: "bg-gray-500/20 text-gray-400", label: status };
  return <span className={`px-2 py-0.5 rounded text-xs ${s.bg}`}>{s.label}</span>;
}
