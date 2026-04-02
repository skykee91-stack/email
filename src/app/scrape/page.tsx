"use client";
import { useState } from "react";

export default function ScrapePage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [manualForm, setManualForm] = useState({ name: "", email: "", phone: "", category: "", region: "", address: "" });

  // 수동 업체 추가
  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualForm),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ message: `${data.business.name} 추가 완료!` });
      setManualForm({ name: "", email: "", phone: "", category: "", region: "", address: "" });
    } else {
      setResult({ error: data.error });
    }
  };

  // CSV/JSON 업로드
  const handleUpload = async () => {
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    let businesses: any[] = [];

    if (file.name.endsWith(".json")) {
      businesses = JSON.parse(text);
    } else if (file.name.endsWith(".csv")) {
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      businesses = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || null; });
        return obj;
      });
    }

    let added = 0, skipped = 0;
    for (const biz of businesses) {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(biz),
      });
      if (res.ok) added++; else skipped++;
    }

    setResult({ message: `완료! 추가: ${added}건, 건너뛰기: ${skipped}건` });
    setImporting(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">수집 관리</h1>
        <p className="text-gray-400 mt-1">업체 데이터 수집 및 등록</p>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg ${result.error ? "bg-red-900/30 border border-red-800 text-red-400" : "bg-green-900/30 border border-green-800 text-green-400"}`}>
          {result.message || result.error}
        </div>
      )}

      {/* 수동 추가 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">수동 업체 추가</h2>
        <form onSubmit={addManual} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} required
            placeholder="업체명 *" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500" />
          <input value={manualForm.email} onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
            placeholder="이메일" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500" />
          <input value={manualForm.phone} onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
            placeholder="전화번호" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500" />
          <input value={manualForm.category} onChange={e => setManualForm({ ...manualForm, category: e.target.value })}
            placeholder="업종" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500" />
          <input value={manualForm.region} onChange={e => setManualForm({ ...manualForm, region: e.target.value })}
            placeholder="지역" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">추가</button>
        </form>
      </div>

      {/* 파일 업로드 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">파일로 대량 등록</h2>
        <p className="text-sm text-gray-400 mb-4">CSV 또는 JSON 파일을 업로드하세요. 필드: name, email, phone, category, region, address</p>
        <div className="flex gap-3">
          <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files?.[0] || null)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <button onClick={handleUpload} disabled={!file || importing}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            {importing ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>

      {/* 스크래퍼 안내 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">자동 수집 (스크래퍼)</h2>
        <p className="text-sm text-gray-400 mb-2">
          네이버 플레이스 자동 수집은 서버(Railway 등)에서 실행해야 합니다.
          기존 Python 스크래퍼로 수집 후 CSV로 내보내기 하면 위 업로드 기능으로 등록 가능합니다.
        </p>
        <p className="text-sm text-gray-500">
          JS 스크래퍼는 추후 서버 환경 구축 시 추가됩니다.
        </p>
      </div>
    </div>
  );
}
