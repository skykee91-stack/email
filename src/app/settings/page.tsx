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

      {/* 발신자 정보 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">발신자 정보 (법률 필수)</h2>
        <p className="text-sm text-gray-400 mb-4">이메일 하단에 자동으로 삽입되는 정보입니다. 코드에서 수정하세요.</p>
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">회사명: <span className="text-gray-500">[회사명]</span></p>
          <p className="text-gray-300">사업자등록번호: <span className="text-gray-500">[000-00-00000]</span></p>
          <p className="text-gray-300">주소: <span className="text-gray-500">[회사 주소]</span></p>
          <p className="text-gray-300">연락처: <span className="text-gray-500">[전화번호]</span></p>
        </div>
      </div>

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
