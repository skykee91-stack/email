"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-500">로딩 중...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      try {
        setEmail(atob(token.replace(/-/g, "+").replace(/_/g, "/")));
      } catch { setEmail(""); }
    }
  }, [token]);

  const handleUnsubscribe = async () => {
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    });
    if (res.ok) setDone(true);
    else setError("처리 중 오류가 발생했습니다");
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center -ml-64">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-white mb-2">수신거부 완료</h1>
          <p className="text-gray-400">더 이상 이메일이 발송되지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center -ml-64">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">수신거부</h1>
        <p className="text-gray-400 mb-6">
          {email ? `${email} 주소로 더 이상 이메일을 받지 않으시겠습니까?` : "수신거부를 원하시면 아래 버튼을 클릭하세요."}
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <button onClick={handleUnsubscribe}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full">
          수신거부 확인
        </button>
      </div>
    </div>
  );
}
