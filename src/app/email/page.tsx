"use client";
import { useState, useEffect, useMemo } from "react";

interface Template { id: string; name: string; step: number; subject: string; }
interface Profile { id: string; serviceName: string; senderName: string; senderEmail: string; isDefault: boolean; }

// 템플릿 이름에서 브랜드/차수/라벨 파싱
// 예: "피원코팅즈(랩핑/바이크/사이클용) - 1차 매출확장" → brand=피원코팅즈(랩핑/바이크/사이클용), step=1, label=매출확장
function parseTemplate(name: string): { brand: string; step: number; label: string } {
  const m = name.match(/^(.+?)\s*-\s*(\d+)차\s*(.*)$/);
  if (m) return { brand: m[1].trim(), step: Number(m[2]), label: m[3].trim() };
  return { brand: "기타", step: 0, label: name };
}

export default function EmailPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sends, setSends] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateB, setSelectedTemplateB] = useState(""); // A/B 테스트 B 변형
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [abTestMode, setAbTestMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [step, setStep] = useState(1);
  const [maxCount, setMaxCount] = useState(100);
  const [delaySeconds, setDelaySeconds] = useState(5); // 발송 간격(초)
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewTargets, setPreviewTargets] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [previewEmail, setPreviewEmail] = useState<any>(null); // 보낸 이메일 미리보기
  const [pending, setPending] = useState<any>(null); // 미발송 알림
  const [sendStatus, setSendStatus] = useState<any>(null); // 백그라운드 발송 상태

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch("/api/sender-profiles").then(r => r.json()).then(d => {
      setProfiles(d.profiles || []);
      const def = d.profiles?.find((p: Profile) => p.isDefault);
      if (def) setSelectedProfile(def.id);
    });
    fetch("/api/businesses?limit=1").then(r => r.json()).then(d => {
      if (d.categories) setCategories(d.categories);
      if (d.regions) setRegions(d.regions);
    });
    fetch("/api/email/pending").then(r => r.json()).then(d => setPending(d)).catch(() => {});
    fetch("/api/email/send").then(r => r.json()).then(d => setSendStatus(d)).catch(() => {});
    fetchSends();
  }, []);

  // 발송 상태 10초마다 폴링
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/email/send").then(r => r.json()).then(d => setSendStatus(d)).catch(() => {});
      fetch("/api/email/pending").then(r => r.json()).then(d => setPending(d)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
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

  // 템플릿을 브랜드별로 그룹핑
  const groupedTemplates = useMemo(() => {
    const map: Record<string, Array<{ template: Template; step: number; label: string }>> = {};
    for (const t of templates) {
      const p = parseTemplate(t.name);
      if (!map[p.brand]) map[p.brand] = [];
      map[p.brand].push({ template: t, step: p.step, label: p.label });
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.step - b.step);
    return map;
  }, [templates]);

  const brands = useMemo(() => Object.keys(groupedTemplates), [groupedTemplates]);

  // 1) 초기 진입 시 첫 브랜드만 자동 선택 — 이후 사용자가 탭으로 자유롭게 변경
  useEffect(() => {
    if (brands.length === 0) return;
    setSelectedBrand(prev => prev || brands[0]);
  }, [brands]);

  // 2) 템플릿이 바뀌면 그 템플릿의 브랜드로만 동기화
  // selectedBrand 변경(탭 클릭) 으론 재실행되지 않음 → 사용자가 다른 브랜드 탭 눌러도 되돌아가지 않음
  useEffect(() => {
    if (!selectedTemplate) return;
    const tpl = templates.find(t => t.id === selectedTemplate);
    if (!tpl) return;
    const b = parseTemplate(tpl.name).brand;
    if (b && brands.includes(b)) setSelectedBrand(b);
  }, [selectedTemplate, templates, brands]);

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
    const tplName = templates.find(t => t.id === selectedTemplate)?.name || selectedTemplate;
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: selectedTemplate, step, maxCount, dryRun: false,
        profileId: selectedProfile || undefined,
        delaySeconds,
        _templateName: tplName,
        ...(abTestMode && selectedTemplateB ? { templateIdB: selectedTemplateB } : {}),
        filters: { ...(category && { category }), ...(region && { region }) },
      }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
    setShowPreview(false);
    fetchSends();
    // 발송 상태 즉시 갱신
    fetch("/api/email/send").then(r => r.json()).then(d => setSendStatus(d)).catch(() => {});
  };

  const selectedTpl = templates.find(t => t.id === selectedTemplate);
  const selectedProf = profiles.find(p => p.id === selectedProfile);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">이메일 발송</h1>
        <p className="text-gray-400 mt-1">영업 이메일 발송 관리</p>
      </div>

      {/* 백그라운드 발송 상태 */}
      {sendStatus?.sendJob?.status === 'running' && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 font-semibold text-sm animate-pulse">
              {sendStatus.sendJob.kind === 'followup' ? '팔로업' : '일반'} 발송 진행 중
            </p>
            <span className="text-green-300 text-xs">{sendStatus.sendJob.templateName}</span>
          </div>
          <p className="text-gray-400 text-xs">
            업종: {sendStatus.sendJob.category} | 시작: {new Date(sendStatus.sendJob.startedAt).toLocaleTimeString("ko-KR")}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (((sendStatus.sendJob.sent || 0) + (sendStatus.sendJob.skipped || 0)) / Math.max(sendStatus.sendJob.totalTargets || 1, 1)) * 100)}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {(sendStatus.sendJob.sent || 0) + (sendStatus.sendJob.skipped || 0)} / {sendStatus.sendJob.totalTargets} (발송 {sendStatus.sendJob.sent || 0}, 스킵 {sendStatus.sendJob.skipped || 0})
          </p>
          {sendStatus.queueLength > 0 && (
            <div className="mt-3 pt-3 border-t border-green-800/50">
              <p className="text-yellow-400 text-xs mb-2">
                대기열: {sendStatus.queueLength}건 (현재 발송 완료 후 자동 시작)
              </p>
              <div className="space-y-1">
                {sendStatus.queue?.map((q: any) => (
                  <div key={q.position} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-yellow-900/40 text-yellow-300">
                      {q.position}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${q.kind === 'followup' ? 'bg-purple-900/40 text-purple-300' : 'bg-blue-900/40 text-blue-300'}`}>
                      {q.kind === 'followup' ? '팔로업' : '일반'}
                    </span>
                    <span className="text-gray-300 truncate">{q.templateName}</span>
                    <span className="text-gray-500">· {q.category}</span>
                    <span className="text-gray-500 ml-auto">{q.totalTargets}건</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {sendStatus?.sendJob?.status === 'done' && sendStatus.sendJob.finishedAt && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p className="text-blue-400 font-semibold text-sm">최근 발송 완료</p>
          <p className="text-gray-400 text-xs">
            {sendStatus.sendJob.templateName} | 발송 {sendStatus.sendJob.sent}건 / 스킵 {sendStatus.sendJob.skipped}건 | {new Date(sendStatus.sendJob.finishedAt).toLocaleTimeString("ko-KR")} 완료
          </p>
        </div>
      )}

      {/* 미발송 알림 (브랜드별) */}
      {pending && (pending.unsent1?.total > 0 || pending.pending2?.total > 0) && (
        <div className="mb-4 space-y-3">
          {/* 브랜드별 1차 미발송 */}
          {pending.unsent1?.byBrand?.filter((b: { total: number }) => b.total > 0).map((brand: { brand: string; total: number; byCategory: { category: string; count: number }[] }) => (
            <div key={`unsent-${brand.brand}`} className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
              <p className="text-yellow-400 font-semibold text-sm mb-2">
                [{brand.brand}] 1차 미발송 {brand.total}개
              </p>
              <div className="flex flex-wrap gap-2">
                {brand.byCategory?.slice(0, 15).map(c => (
                  <span key={c.category} className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded">
                    {c.category} {c.count}개
                  </span>
                ))}
                {brand.byCategory?.length > 15 && (
                  <span className="px-2 py-1 text-yellow-500 text-xs">... 외 {brand.byCategory.length - 15}개 업종</span>
                )}
              </div>
            </div>
          ))}

          {/* 브랜드별 2차 팔로업 대기 */}
          {pending.pending2?.byBrand?.filter((b: { total: number }) => b.total > 0).map((brand: { brand: string; total: number; byCategory: { category: string; count: number }[] }) => (
            <div key={`pending2-${brand.brand}`} className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <p className="text-blue-400 font-semibold text-sm mb-2">
                [{brand.brand}] 2차 팔로업 대기 {brand.total}개 (3일 경과)
              </p>
              <div className="flex flex-wrap gap-2">
                {brand.byCategory?.slice(0, 15).map(c => (
                  <span key={c.category} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                    {c.category} {c.count}개
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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

          {/* 템플릿: 브랜드 탭 + 차수 카드 */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm text-gray-400 mb-2">이메일 템플릿</label>
            {brands.length === 0 ? (
              <p className="text-xs text-gray-500">템플릿이 없습니다</p>
            ) : (
              <>
                {/* 브랜드 탭 */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {brands.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        selectedBrand === b
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      {b}
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({groupedTemplates[b].length})
                      </span>
                    </button>
                  ))}
                </div>
                {/* 차수 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(groupedTemplates[selectedBrand] || []).map(({ template, step: tStep, label }) => {
                    const active = selectedTemplate === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => onTemplateChange(template.id)}
                        className={`text-left px-3 py-2 rounded border text-sm transition-colors ${
                          active
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                        }`}
                      >
                        <div className="font-medium">
                          {tStep}차 {label ? `— ${label}` : ""}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {template.subject}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* A/B 테스트 토글 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">A/B 테스트</label>
            <button onClick={() => { setAbTestMode(!abTestMode); setSelectedTemplateB(""); }}
              className={`w-full px-3 py-2 rounded text-sm font-semibold ${abTestMode ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
              {abTestMode ? "A/B 테스트 ON" : "A/B 테스트 OFF"}
            </button>
          </div>

          {/* A/B 테스트 B 변형 선택 — 같은 브랜드 내에서만 */}
          {abTestMode && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                B 변형 템플릿 <span className="text-gray-600">({selectedBrand || "-"})</span>
              </label>
              <select value={selectedTemplateB} onChange={e => setSelectedTemplateB(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-orange-500/50 rounded text-white text-sm">
                <option value="">B 변형 선택</option>
                {(groupedTemplates[selectedBrand] || [])
                  .filter(({ template }) => template.id !== selectedTemplate)
                  .map(({ template, step: tStep, label }) => (
                    <option key={template.id} value={template.id}>
                      {tStep}차 {label ? `— ${label}` : ""}
                    </option>
                  ))}
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
            <label className="block text-sm text-gray-400 mb-1">업종 필터</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value="">전체 업종</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 지역 필터 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">지역 필터</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value="">전체 지역</option>
              {/* 시/도 대분류 */}
              {[...new Set(regions.map(r => r.split(" ")[0]))].map(city => (
                <option key={city} value={city}>── {city} 전체 ──</option>
              ))}
              {/* 세부 지역 */}
              {regions.map(r => <option key={r} value={r}>&nbsp;&nbsp;&nbsp;{r}</option>)}
            </select>
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
              <option value={1000}>1000개</option>
              <option value={2000}>2000개</option>
              <option value={4000}>4000개</option>
              <option value={5000}>5000개 (전체)</option>
            </select>
          </div>

          {/* 발송 간격 (스팸 회피) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">발송 간격 (스팸 회피)</label>
            <select value={delaySeconds} onChange={e => setDelaySeconds(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              <option value={0}>없음 (한번에)</option>
              <option value={3}>3초 (시간당 1200건)</option>
              <option value={5}>5초 (시간당 720건) 권장</option>
              <option value={10}>10초 (시간당 360건)</option>
              <option value={20}>20초 (시간당 180건) 안전</option>
              <option value={30}>30초 (시간당 120건) 매우 안전</option>
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
            {sending ? "처리 중..." : sendStatus?.sendJob?.status === 'running' ? "대기열에 추가" : "실제 발송"}
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
              <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer" onClick={() => setPreviewEmail(s)} title="클릭하면 보낸 이메일 내용을 볼 수 있습니다">
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

      {/* 보낸 이메일 미리보기 모달 */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewEmail(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold">보낸 이메일 미리보기</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-400">받는 사람: <span className="text-white">{previewEmail.business?.name}</span> ({previewEmail.business?.email})</p>
                  <p className="text-gray-400">단계: <span className="text-blue-400">{previewEmail.step}차</span> | 상태: <StatusBadge status={previewEmail.status} /> | 열람: {previewEmail.openCount || 0}회</p>
                  <p className="text-gray-400">발송일: {previewEmail.sentAt ? new Date(previewEmail.sentAt).toLocaleString("ko-KR") : "-"}</p>
                </div>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
            </div>
            {/* 제목 */}
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
              <p className="text-gray-400 text-xs mb-1">제목</p>
              <p className="text-white text-sm">{previewEmail.renderedSubject || "(저장된 제목 없음 - 이전 발송분)"}</p>
            </div>
            {/* 본문 */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {previewEmail.renderedBody ? (
                <div className="bg-white rounded p-4" dangerouslySetInnerHTML={{ __html: previewEmail.renderedBody }} />
              ) : (
                <p className="text-gray-500 text-center py-8">저장된 본문 없음 (이 기능 추가 전에 보낸 이메일입니다)</p>
              )}
            </div>
          </div>
        </div>
      )}
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
