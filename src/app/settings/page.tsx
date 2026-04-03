"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [brevoStatus, setBrevoStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/health").then(r => r.json()),
    ]).then(([health]) => {
      setDbStatus(health);
      setLoading(false);
    });
  }, []);

  const testBrevo = async () => {
    try {
      const res = await fetch("/api/settings/brevo-test");
      const data = await res.json();
      setBrevoStatus(data);
    } catch {
      setBrevoStatus({ error: "연결 실패" });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-gray-400 mt-1">시스템 설정 및 상태</p>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">시스템 상태</h2>
        {loading ? <p className="text-gray-500">확인 중...</p> : (
          <div className="space-y-3">
            <StatusRow label="DB 연결" status={dbStatus?.status === "ok" ? "ok" : "error"}
              detail={dbStatus?.status === "ok" ? `업체 ${dbStatus.db.businesses}개, 템플릿 ${dbStatus.db.templates}개, 발송 ${dbStatus.db.sends}개` : "연결 실패"} />
            <StatusRow label="Brevo API" status={brevoStatus ? (brevoStatus.error ? "error" : "ok") : "pending"}
              detail={brevoStatus ? (brevoStatus.error || `플랜: ${brevoStatus.plan || "확인됨"}`) : "테스트 안 됨"} />
            <StatusRow label="사이트 URL" status="ok" detail={process.env.NEXT_PUBLIC_URL || "설정 안 됨"} />
          </div>
        )}
        <button onClick={testBrevo} className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
          Brevo 연결 테스트
        </button>
      </div>

      {/* 발신자 프로필 관리 */}
      <SenderProfiles />

      {/* 환경 변수 상태 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">환경 변수</h2>
        <div className="space-y-2 text-sm">
          <EnvRow name="DATABASE_URL" set={true} />
          <EnvRow name="BREVO_API_KEY" set={!!process.env.NEXT_PUBLIC_URL} />
          <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" set={true} />
          <EnvRow name="NEXT_PUBLIC_URL" set={true} />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status, detail }: { label: string; status: "ok" | "pending" | "error"; detail: string }) {
  const map = { ok: { dot: "bg-green-500", text: "정상" }, pending: { dot: "bg-yellow-500", text: "대기" }, error: { dot: "bg-red-500", text: "오류" } };
  const s = map[status];
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${s.dot}`} /><span className="text-sm text-white">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{detail}</span><span className="text-xs text-gray-400">{s.text}</span>
      </div>
    </div>
  );
}

function EnvRow({ name, set }: { name: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <code className="text-gray-300">{name}</code>
      <span className={`text-xs ${set ? "text-green-400" : "text-red-400"}`}>{set ? "설정됨" : "미설정"}</span>
    </div>
  );
}

// ─── 발신자 프로필 관리 ───
interface Profile {
  id: string;
  serviceName: string;
  senderName: string;
  senderEmail: string;
  companyName: string;
  representative: string | null;
  address: string | null;
  phone: string | null;
  businessNumber: string | null;
  isDefault: boolean;
}

function SenderProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    serviceName: "", senderName: "", senderEmail: "",
    companyName: "", representative: "", address: "",
    phone: "", businessNumber: "", isDefault: false,
  });
  const [msg, setMsg] = useState("");

  const fetchProfiles = async () => {
    const res = await fetch("/api/sender-profiles");
    const data = await res.json();
    setProfiles(data.profiles || []);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const resetForm = () => {
    setForm({ serviceName: "", senderName: "", senderEmail: "", companyName: "", representative: "", address: "", phone: "", businessNumber: "", isDefault: false });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: Profile) => {
    setForm({
      serviceName: p.serviceName, senderName: p.senderName, senderEmail: p.senderEmail,
      companyName: p.companyName, representative: p.representative || "",
      address: p.address || "", phone: p.phone || "",
      businessNumber: p.businessNumber || "", isDefault: p.isDefault,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const res = await fetch("/api/sender-profiles", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
    });
    if (res.ok) {
      setMsg(isEdit ? "수정 완료!" : "프로필 추가 완료!");
      resetForm();
      fetchProfiles();
    } else {
      const data = await res.json();
      setMsg(data.error || "실패");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/sender-profiles?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("삭제 완료");
      fetchProfiles();
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const setDefault = async (id: string) => {
    await fetch("/api/sender-profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    fetchProfiles();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">발신자 프로필</h2>
          <p className="text-sm text-gray-400">서비스별 발신 이메일과 사업자 정보를 관리합니다</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          {showForm ? "취소" : "+ 새 프로필"}
        </button>
      </div>

      {msg && <div className="mb-4 p-3 rounded bg-blue-900/30 border border-blue-800 text-blue-400 text-sm">{msg}</div>}

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-800/50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.serviceName} onChange={e => setForm({...form, serviceName: e.target.value})} required
              placeholder="서비스명 (예: 셀포) *" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.senderEmail} onChange={e => setForm({...form, senderEmail: e.target.value})} required
              placeholder="발신 이메일 *" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})}
              placeholder="발신자 표시명 (예: 셀포 by 마스터인사이트)" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})}
              placeholder="사업자명 (예: (주)마스터인사이트)" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.representative} onChange={e => setForm({...form, representative: e.target.value})}
              placeholder="대표자명" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              placeholder="주소" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="연락처" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
            <input value={form.businessNumber} onChange={e => setForm({...form, businessNumber: e.target.value})}
              placeholder="사업자등록번호 (선택)" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})}
                className="rounded" />
              기본 프로필로 설정
            </label>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              {editingId ? "수정 저장" : "추가"}
            </button>
          </div>
        </form>
      )}

      {/* 프로필 목록 */}
      {profiles.length === 0 ? (
        <p className="text-gray-500 text-center py-6">등록된 발신자 프로필이 없습니다. 위에서 추가하세요.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className={`p-4 rounded-lg border ${p.isDefault ? "border-blue-600 bg-blue-900/10" : "border-gray-800 bg-gray-800/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">{p.serviceName}</span>
                  {p.isDefault && <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">기본</span>}
                </div>
                <div className="flex gap-2">
                  {!p.isDefault && (
                    <button onClick={() => setDefault(p.id)} className="text-xs text-blue-400 hover:text-blue-300">기본으로</button>
                  )}
                  <button onClick={() => startEdit(p)} className="text-xs text-yellow-400 hover:text-yellow-300">수정</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <p className="text-gray-400">발신: <span className="text-gray-300">{p.senderName}</span></p>
                <p className="text-gray-400">이메일: <span className="text-gray-300">{p.senderEmail}</span></p>
                <p className="text-gray-400">사업자: <span className="text-gray-300">{p.companyName || "-"}</span></p>
                <p className="text-gray-400">대표: <span className="text-gray-300">{p.representative || "-"}</span></p>
                <p className="text-gray-400">주소: <span className="text-gray-300">{p.address || "-"}</span></p>
                <p className="text-gray-400">연락처: <span className="text-gray-300">{p.phone || "-"}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
