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

// 관련 키워드 매핑 (Python data.py의 KEYWORD_GROUPS와 동일)
const KEYWORD_GROUPS: Record<string, string[]> = {
  // 자동차
  "랩핑": ["랩핑", "차량랩핑", "카랩핑", "자동차랩핑", "PPF", "랩핑업체", "광고랩핑"],
  "차량랩핑": ["차량랩핑", "랩핑", "카랩핑", "자동차랩핑", "PPF"],
  "PPF": ["PPF", "랩핑", "차량랩핑", "페인트보호필름"],
  "자동차정비": ["자동차정비", "카센터", "자동차수리", "자동차공업사"],
  "카센터": ["카센터", "자동차정비", "자동차수리", "자동차공업사"],
  "세차장": ["세차장", "세차", "손세차", "자동세차", "셀프세차"],
  "자동차튜닝": ["자동차튜닝", "튜닝샵", "자동차용품", "카튜닝"],
  "타이어": ["타이어", "타이어교체", "타이어가게", "타이어전문점"],
  // 미용·뷰티
  "미용실": ["미용실", "헤어살롱", "헤어샵", "미장원"],
  "네일샵": ["네일샵", "네일아트", "젤네일", "네일케어"],
  "피부관리": ["피부관리", "피부관리실", "에스테틱", "피부샵"],
  "피부과": ["피부과", "피부클리닉", "피부전문", "피부과의원"],
  "속눈썹": ["속눈썹", "속눈썹연장", "래쉬", "속눈썹펌"],
  "왁싱": ["왁싱", "왁싱샵", "브라질리언왁싱", "제모"],
  "타투": ["타투", "타투샵", "문신", "반영구"],
  // 건강·운동
  "마사지": ["마사지", "마사지샵", "스포츠마사지", "경락마사지", "타이마사지"],
  "필라테스": ["필라테스", "필라테스학원", "요가필라테스"],
  "요가": ["요가", "요가학원", "요가원", "핫요가"],
  "헬스장": ["헬스장", "피트니스", "헬스클럽", "GYM", "짐"],
  "수영장": ["수영장", "수영강습", "실내수영장", "스포츠센터"],
  // 병원·의료
  "치과": ["치과", "치과의원", "임플란트치과", "교정치과", "치아교정"],
  "병원": ["병원", "의원", "종합병원", "내과", "외과"],
  "한의원": ["한의원", "한방병원", "한방클리닉", "한의"],
  "동물병원": ["동물병원", "동물의료센터", "펫클리닉", "수의과"],
  "성형외과": ["성형외과", "성형외과의원", "미용성형", "성형클리닉"],
  // 음식·카페
  "카페": ["카페", "커피숍", "커피전문점", "디저트카페", "브런치카페"],
  "음식점": ["음식점", "맛집", "식당", "한식", "중식"],
  // 교육
  "학원": ["학원", "보습학원", "입시학원", "종합학원"],
  "영어학원": ["영어학원", "어학원", "영어교습소", "영어과외"],
  "수학학원": ["수학학원", "수학교습소", "수학과외", "수학전문"],
  "코딩학원": ["코딩학원", "프로그래밍학원", "코딩교육", "SW학원"],
  // 인테리어·청소
  "인테리어": ["인테리어", "인테리어업체", "실내인테리어", "리모델링"],
  "도배": ["도배", "도배장판", "도배업체", "장판"],
  "청소업체": ["청소업체", "청소대행", "입주청소", "이사청소", "사무실청소"],
  "이사업체": ["이사업체", "포장이사", "원룸이사", "사무실이사", "이사"],
  "에어컨청소": ["에어컨청소", "에어컨세척", "에어컨클리닝"],
  // IT·마케팅
  "홈페이지제작": ["홈페이지제작", "웹사이트제작", "웹디자인", "홈페이지개발"],
  "광고대행사": ["광고대행사", "마케팅대행", "광고대행", "온라인마케팅"],
  "SNS마케팅": ["SNS마케팅", "인스타마케팅", "블로그마케팅", "소셜마케팅"],
  // 법률·세무
  "세무사": ["세무사", "세무법인", "세무회계", "기장대행"],
  "변호사": ["변호사", "법률사무소", "법률상담", "로펌"],
  // 인쇄·간판
  "간판": ["간판", "간판제작", "LED간판", "네온사인", "사인물"],
  "인쇄소": ["인쇄소", "인쇄업체", "디지털인쇄", "명함인쇄"],
  // 숙박·부동산
  "호텔": ["호텔", "모텔", "숙박", "리조트", "게스트하우스"],
  "펜션": ["펜션", "풀빌라", "글램핑", "캠핑장"],
  "부동산": ["부동산", "공인중개사", "부동산중개", "부동산컨설팅"],
};

export default function ScrapePage() {
  // 자동 수집
  const [searchMode, setSearchMode] = useState<"category" | "custom">("category");
  const [category, setCategory] = useState("치과");
  const [customQuery, setCustomQuery] = useState("");
  const [region, setRegion] = useState("");
  const [target, setTarget] = useState(100);
  const [keywords, setKeywords] = useState("");  // 관련 키워드 (쉼표 구분)
  const [scraping, setScraping] = useState(false);
  const [job, setJob] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // 카테고리/검색어 변경 시 관련 키워드 자동 로드
  useEffect(() => {
    const query = searchMode === "custom" ? customQuery : category;
    const mapped = KEYWORD_GROUPS[query];
    setKeywords(mapped ? mapped.join(", ") : query);
  }, [category, customQuery, searchMode]);

  // 파일 업로드
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // 결과 메시지
  const [result, setResult] = useState<any>(null);
  const [scrapeMode, setScrapeMode] = useState<"local" | "remote">("local");
  const [scraperOnline, setScraperOnline] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);

  // 초기 모드 확인 + 이미 실행 중인 작업 감지
  useEffect(() => {
    fetch("/api/scrape/start").then(r => r.json()).then(d => {
      setScrapeMode(d.mode || "local");
      setScraperOnline(d.scraperOnline || false);
      if (d.queue) setQueue(d.queue);
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
          if (data.queue) setQueue(data.queue);
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

    // 키워드 파싱 (쉼표로 구분)
    const keywordList = keywords.split(",").map(k => k.trim()).filter(Boolean);

    const res = await fetch("/api/scrape/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(searchMode === "custom" ? { query: customQuery } : { category }),
        region: region || undefined,
        target,
        keywords: keywordList.length > 0 ? keywordList : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult({ error: data.error });
      setScraping(false);
    } else if (data.queued) {
      setResult({ message: data.message });
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

        {/* 관련 키워드 편집 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">관련 키워드 (자동 로드, 직접 수정 가능 - 쉼표로 구분)</label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="쉼표로 구분 (예: 랩핑, 차량랩핑, PPF)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
          <p className="text-xs text-gray-600 mt-1">
            각 키워드로 순차 검색하여 더 많은 업체를 수집합니다. 불필요한 키워드는 삭제하세요.
          </p>
        </div>

        <p className="text-xs text-gray-500">이메일 없는 업체도 수집됩니다. 수집 완료 시 DB에 자동 저장.</p>

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
            <p className="text-xs text-gray-500 mt-2">업체 {job.found}개 확보 중... (이메일 없는 업체 포함)</p>
          </div>
        )}

        {/* 대기열 표시 */}
        {queue.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
            <p className="text-sm text-yellow-400 font-semibold mb-2">대기열 ({queue.length}개)</p>
            {queue.map((q: any, i: number) => (
              <p key={i} className="text-xs text-gray-400">
                {i + 1}. {q.category} / {q.region || "전국"} / {q.target}개
              </p>
            ))}
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
