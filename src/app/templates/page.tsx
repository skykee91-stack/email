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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">이메일 템플릿</h1>
          <p className="text-gray-400 mt-1">발송할 이메일 디자인 관리</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", step: 1, subject: "", htmlBody: "", category: "", abVariant: "" }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? "취소" : "+ 새 템플릿"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">템플릿 이름</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="예: 1차 제안서 - 미용실" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-gray-400 mb-1">단계</label>
                <select value={form.step} onChange={(e) => setForm({ ...form, step: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                  <option value={1}>1차</option><option value={2}>2차</option>
                  <option value={3}>3차</option><option value={4}>4차</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">업종</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="전체" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">A/B</label>
                <input value={form.abVariant} onChange={(e) => setForm({ ...form, abVariant: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="A" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일 제목 <span className="text-gray-600">(변수: {"{사업자명}"}, {"{업종}"}, {"{지역}"})</span></label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="예: {사업자명}님, 매출을 올려드립니다" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일 본문 (HTML)</label>
            <textarea value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} required rows={8}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
              placeholder="<h1>안녕하세요, {사업자명}님!</h1><p>...</p>" />
          </div>
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            {editId ? "수정 완료" : "템플릿 생성"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
            아직 템플릿이 없습니다. 위 버튼으로 새 템플릿을 만드세요!
          </div>
        ) : templates.map((t) => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{t.step}차</span>
                  {t.category && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">{t.category}</span>}
                  {t.abVariant && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">{t.abVariant}</span>}
                  <span className="text-white font-medium">{t.name}</span>
                </div>
                <p className="text-sm text-gray-400">제목: {t.subject}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(t)} className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">수정</button>
                <button onClick={() => handleDelete(t.id)} className="px-3 py-1 text-xs bg-red-900/50 text-red-400 rounded hover:bg-red-900">삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
