"use client";
import { useState, useEffect } from "react";

interface Template {
  id: string; name: string; step: number; subject: string;
  htmlBody: string; category: string | null; abVariant: string | null;
  isActive: boolean; createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", step: 1, subject: "", htmlBody: "", category: "", abVariant: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  const fetchTemplates = async () => {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, id: editId } : form;
    await fetch("/api/templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false); setEditId(null);
    setForm({ name: "", step: 1, subject: "", htmlBody: "", category: "", abVariant: "" });
    fetchTemplates();
  };

  const handleEdit = (t: Template) => {
    setForm({ name: t.name, step: t.step, subject: t.subject, htmlBody: t.htmlBody, category: t.category || "", abVariant: t.abVariant || "" });
    setEditId(t.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const handleDuplicate = async (t: Template) => {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${t.name} (복사)`,
        step: t.step,
        subject: t.subject,
        htmlBody: t.htmlBody,
        category: t.category,
        abVariant: t.abVariant,
      }),
    });
    fetchTemplates();
  };

  // 프리셋 템플릿 등록
  const loadPreset = async (campaign: string) => {
    if (!confirm(`${campaign} 1~4차 템플릿을 자동으로 등록할까요?`)) return;
    await fetch(`/api/templates/presets?campaign=${encodeURIComponent(campaign)}`, { method: "POST" });
    fetchTemplates();
  };

  // 상품/캠페인 목록 추출
  const campaigns = [...new Set(templates.map(t => t.category).filter(Boolean))] as string[];

  // 필터링
  const filtered = filterCategory
    ? templates.filter(t => t.category === filterCategory)
    : templates;

  // 상품별 그룹핑
  const grouped = filtered.reduce((acc, t) => {
    const key = t.category || "미분류";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">이메일 템플릿</h1>
          <p className="text-gray-400 mt-1">상품/캠페인별 이메일 디자인 관리</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadPreset("셀포")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            셀포 1~4차 자동등록
          </button>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", step: 1, subject: "", htmlBody: "", category: "", abVariant: "" }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showForm ? "취소" : "+ 새 템플릿"}
          </button>
        </div>
      </div>

      {/* 상품/캠페인 필터 */}
      {campaigns.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterCategory("")}
            className={`px-3 py-1.5 rounded-lg text-sm ${!filterCategory ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            전체
          </button>
          {campaigns.map(c => (
            <button key={c} onClick={() => setFilterCategory(filterCategory === c ? "" : c)}
              className={`px-3 py-1.5 rounded-lg text-sm ${filterCategory === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 새 템플릿 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">템플릿 이름</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="예: 셀포 - 1차 제안서" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">상품/캠페인 <span className="text-gray-600">(같은 이름끼리 묶여요)</span></label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="예: 셀포, 피원코팅, 마케팅대행" list="campaign-list" />
              <datalist id="campaign-list">
                {campaigns.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">발송 단계</label>
              <select value={form.step} onChange={(e) => setForm({ ...form, step: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                <option value={1}>1차 (첫 제안)</option>
                <option value={2}>2차 (팔로업)</option>
                <option value={3}>3차 (추가 정보)</option>
                <option value={4}>4차 (마지막 제안)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">A/B 테스트 변형</label>
              <input value={form.abVariant} onChange={(e) => setForm({ ...form, abVariant: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="예: A, B, C" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                {editId ? "수정 완료" : "템플릿 생성"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              이메일 제목 <span className="text-gray-600">(사용 가능 변수: {"{사업자명}"}, {"{업종}"}, {"{지역}"})</span>
            </label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="예: {사업자명}님, 셀포로 매출을 올려보세요" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일 본문 (HTML)</label>
            <textarea value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} required rows={10}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
              placeholder="<h2>안녕하세요, {사업자명}님!</h2>&#10;<p>{지역}에서 {업종}을 운영하고 계신 것으로 알고 있습니다.</p>&#10;<p>저희 셀포 서비스를 소개드립니다...</p>" />
          </div>
        </form>
      )}

      {/* 상품별 그룹 표시 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          아직 템플릿이 없습니다. 위 버튼으로 새 템플릿을 만드세요!
        </div>
      ) : (
        Object.entries(grouped).map(([campaign, items]) => (
          <div key={campaign} className="mb-6">
            {/* 상품/캠페인 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">{campaign}</span>
              <span className="text-sm text-gray-500">{items.length}개 템플릿</span>
            </div>

            <div className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">{t.step}차</span>
                        {t.abVariant && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">{t.abVariant}</span>}
                        <span className="text-white font-medium">{t.name}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">제목: {t.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDuplicate(t)} className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">복사</button>
                      <button onClick={() => handleEdit(t)} className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">수정</button>
                      <button onClick={() => handleDelete(t.id)} className="px-3 py-1 text-xs bg-red-900/50 text-red-400 rounded hover:bg-red-900">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
