"use client";
import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  "미용실", "헬스장", "치과", "카페", "음식점", "네일샵", "피부과",
  "한의원", "동물병원", "학원", "영어학원", "수학학원",
  "자동차정비", "카센터", "세차장",
  "인테리어", "청소업체", "이사업체",
  "병원", "성형외과", "피부관리",
  "필라테스", "요가", "수영장",
  "호텔", "펜션", "부동산",
];

export default function ScrapePage() {
  // 자동 수집
  const [searchMode, setSearchMode] = useState<"category" | "custom">("category");
  const [category, setCategory] = useState("치과");
  const [customQuery, setCustomQuery] = useState("");
  const [region, setRegion] = useState("");
  const [target, setTarget] = useState(100);
  const [scraping, setScraping] = useState(false);
  const [job, setJob] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // 파일 업로드
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // 결과 메시지
  const [result, setResult] = useState<any>(null);
  const [scrapeMode, setScrapeMode] = useState<"local" | "remote">("local");
  const [scraperOnline, setScraperOnline] = useState(false);

  // 초기 모드 확인 + 이미 실행 중인 작업 감지
  useEffect(() => {
    fetch("/api/scrape/start").then(r => r.json()).then(d => {
      setScrapeMode(d.mode || "local");
      setScraperOnline(d.scraperOnline || false);
      if (d.job?.status === "running") {
        setJob(d.job);
        setScraping(true);
      }
    }).catch(() => {});
  }, []);

  // 수집 상태 폴링
  useEffect(() => {
    if (scraping) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/scrape/start");
          const data = await res.json();
          setJob(data.job);
          if (data.job?.status === "done" || data.job?.status === "failed") {
            setScraping(false);
            if (pollRef.current) clearInterval(pollRef.current);
            setResult({
              message: data.job.status === "done"
                ? `수집 완료! ${data.job.found}개 업체 (이메일 포함) DB에 자동 저장됨`
                : "수집 중 오류 발생",
            });
          }
        } catch {}
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [scraping]);

  // 수집 시작
  const startScrape = async () => {
    const query = searchMode === "custom" ? customQuery : category;
    if (!query) {
      setResult({ error: "검색어 또는 카테고리를 선택하세요" });
      return;
    }
    setScraping(true);
    setResult(null);
    setJob(null);

    const res = await fetch("/api/scrape/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(searchMode === "custom" ? { query: customQuery } : { category }),
        region: region || undefined,
        target,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult({ error: data.error });
      setScraping(false);
    }
  };

  // CSV/JSON 업로드
  const handleUpload = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      let businesses: any[] = [];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        businesses = Array.isArray(parsed) ? parsed : (parsed.businesses || []);
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) { setResult({ error: "CSV에 데이터 없음" }); setImporting(false); return; }
        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
        businesses = lines.slice(1).map(line => {
          const values = line.match(/("([^"]*)"|[^,]*)/g)?.map(v => v.trim().replace(/^["']|["']$/g, '')) || [];
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i] || null; });
          return obj;
        }).filter(b => b.name);
      }
      if (businesses.length === 0) { setResult({ error: "데이터 없음" }); setImporting(false); return; }
      const res = await fetch("/api/businesses/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businesses }),
      });
      const data = await res.json();
      setResult({ message: res.ok ? `완료! ${data.message}` : data.error });
    } catch (err) {
      setResult({ error: `파일 오류: ${err}` });
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">수집 관리</h1>
        <p className="text-gray-400 mt-1">네이버 플레이스에서 업체를 수집합니다</p>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg ${result.error ? "bg-red-900/30 border border-red-800 text-red-400" : "bg-green-900/30 border border-green-800 text-green-400"}`}>
          {result.message || result.error}
        </div>
      )}

      {/* 연결 상태 표시 */}
      <div className="mb-4 flex items-center gap-2">
        {scrapeMode === "remote" ? (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${scraperOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            <span className={`w-2 h-2 rounded-full ${scraperOnline ? "bg-green-400" : "bg-red-400"}`}></span>
            {scraperOnline ? "원격 스크래퍼 연결됨" : "원격 스크래퍼 꺼져있음"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            로컬 모드
          </span>
        )}
      </div>

      {/* 자동 수집 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">자동 수집 (네이버 플레이스)</h2>

        {/* 검색 방식 선택 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchMode("category")}
            className={`px-4 py-2 rounded text-sm ${searchMode === "category" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}
          >카테고리 선택</button>
          <button
            onClick={() => setSearchMode("custom")}
            className={`px-4 py-2 rounded text-sm ${searchMode === "custom" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}
          >검색어 입력</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {searchMode === "category" ? (
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input value={customQuery} onChange={e => setCustomQuery(e.target.value)}
              placeholder="검색어 (예: 강남 자동차판금)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
          )}

          <select value={region} onChange={e => setRegion(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
            <option value="">서울 전체</option>
            <option value="전국">전국</option>
            <option value="서울">서울</option>
            <option value="부산">부산</option>
            <option value="인천">인천</option>
            <option value="대구">대구</option>
            <option value="대전">대전</option>
            <option value="광주">광주</option>
            <option value="울산">울산</option>
            <option value="세종">세종</option>
            <option value="수원">수원</option>
            <option value="성남">성남</option>
            <option value="고양">고양</option>
            <option value="용인">용인</option>
            <option value="창원">창원</option>
            <option value="천안">천안</option>
            <option value="청주">청주</option>
            <option value="전주">전주</option>
            <option value="포항">포항</option>
            <option value="제주">제주</option>
          </select>

          <select value={target} onChange={e => setTarget(Number(e.target.value))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
            <option value={100}>100개</option>
            <option value={300}>300개</option>
            <option value={500}>500개</option>
            <option value={1000}>1000개</option>
          </select>

          <button onClick={startScrape} disabled={scraping}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-semibold">
            {scraping ? "수집 중..." : "수집 시작"}
          </button>
        </div>

        <p className="text-xs text-gray-500">이메일 있는 업체만 수집됩니다. 수집 완료 시 DB에 자동 저장.</p>

        {/* 진행률 */}
        {job && job.status === "running" && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white">수집 진행 중: {job.category}</span>
              <span className="text-sm text-blue-400 font-bold">{job.found}/{job.target}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 rounded-full h-2 transition-all"
                style={{ width: `${Math.min((job.found / job.target) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">이메일 있는 업체 {job.found}개 확보 중...</p>
          </div>
        )}
      </div>

      {/* 파일 업로드 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">파일로 대량 등록</h2>
        <p className="text-sm text-gray-400 mb-4">CSV 또는 JSON 파일 업로드 (200~300건 대량 등록 가능)</p>
        <div className="flex gap-3">
          <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files?.[0] || null)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
          <button onClick={handleUpload} disabled={!file || importing}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm">
            {importing ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>
    </div>
  );
}
