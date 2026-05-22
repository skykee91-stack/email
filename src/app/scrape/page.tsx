"use client";
import { useState, useEffect, useRef } from "react";

// 대분류 → 소분류 매핑 (네이버 플레이스 업종 기준 전체)
const CATEGORY_GROUPS: Record<string, string[]> = {
  "자동차": [
    "자동차정비", "카센터", "세차장", "손세차", "자동차판금", "자동차도장",
    "자동차튜닝", "타이어", "자동차용품", "자동차랩핑", "PPF", "광택",
    "디테일링세차", "디테일샵", "중고차", "수입차", "렌터카", "리스",
    "주유소", "충전소", "LPG충전소", "주차장", "자동차보험", "자동차검사",
  ],
  "바이크·자전거": [
    "오토바이수리", "바이크매장", "바이크튜닝", "자전거매장", "자전거용품점",
    "전동킥보드", "오토바이용품",
  ],
  "미용·뷰티": [
    "미용실", "헤어살롱", "네일샵", "피부관리", "피부과", "속눈썹",
    "왁싱", "태닝", "두피관리", "메이크업", "반영구", "타투", "눈썹문신",
  ],
  "병원·의료": [
    "치과", "교정치과", "임플란트치과", "병원", "종합병원", "내과",
    "외과", "소아과", "이비인후과", "피부과", "정형외과", "안과",
    "산부인과", "비뇨기과", "신경외과", "신경과", "재활의학과",
    "정신건강의학과", "성형외과", "가정의학과", "통증의학과",
    "한의원", "한방병원", "약국", "동물병원", "동물약국",
  ],
  "건강·힐링": [
    "마사지", "스파", "찜질방", "사우나", "목욕탕",
    "아로마테라피", "발마사지", "경락마사지", "타이마사지",
    "건강검진센터", "건강원", "한약방",
  ],
  "운동·스포츠": [
    "헬스장", "피트니스", "요가", "필라테스", "크로스핏",
    "수영장", "골프연습장", "스크린골프", "볼링장",
    "배드민턴", "테니스", "탁구장", "스쿼시",
    "축구장", "풋살장", "농구장",
    "클라이밍", "댄스학원", "발레학원",
    "복싱", "주짓수", "킥복싱", "MMA",
    "스키장", "빙상장", "승마장",
  ],
  "음식점": [
    "음식점", "한식", "중식", "일식", "양식", "분식",
    "치킨", "피자", "햄버거", "족발·보쌈", "찜·탕·찌개",
    "고기·구이", "삼겹살", "곱창·막창", "회·초밥", "돈까스",
    "국수·면", "냉면", "칼국수", "떡볶이", "김밥",
    "샌드위치", "도시락", "죽", "뷔페", "백반",
    "아시안음식", "베트남음식", "태국음식", "인도음식",
    "멕시칸음식", "브런치", "스테이크", "파스타",
  ],
  "술집·주점": [
    "술집", "호프", "맥주집", "이자카야", "포장마차",
    "와인바", "칵테일바", "위스키바", "소주방", "막걸리",
  ],
  "카페·디저트": [
    "카페", "디저트카페", "베이커리", "아이스크림", "도넛",
    "떡카페", "브런치카페", "북카페", "스터디카페",
    "애견카페", "보드게임카페", "차전문점", "주스전문점",
  ],
  "교육·학원": [
    "학원", "영어학원", "수학학원", "입시학원", "보습학원",
    "코딩학원", "컴퓨터학원", "미술학원", "음악학원", "피아노학원",
    "기타학원", "드럼학원", "바이올린학원", "보컬학원",
    "태권도", "합기도", "검도", "유도",
    "유치원", "어린이집", "놀이학교",
    "운전학원", "요리학원", "플라워학원", "공예학원",
    "외국어학원", "중국어학원", "일본어학원",
    "독서실", "자습실", "과외",
  ],
  "인테리어·건축": [
    "인테리어", "인테리어업체", "리모델링", "도배",
    "타일시공", "바닥시공", "샷시", "방수공사",
    "페인트", "조명시공", "싱크대", "욕실시공",
    "건축설계", "건축시공", "조경", "철거",
  ],
  "청소·방역": [
    "청소업체", "입주청소", "사무실청소", "에어컨청소",
    "이사청소", "카페트청소", "건물청소",
    "방역업체", "소독업체", "해충방제",
    "폐기물처리",
  ],
  "이사·운송": [
    "이사업체", "포장이사", "원룸이사", "사무실이사",
    "용달이사", "화물운송", "퀵서비스", "택배",
    "대리운전", "탁송",
  ],
  "설비·수리": [
    "에어컨설치", "에어컨수리", "보일러수리", "보일러설치",
    "배관", "누수수리", "전기공사", "조명설치",
    "가전수리", "컴퓨터수리", "핸드폰수리", "가구수리",
    "열쇠", "자물쇠", "유리교체", "방충망",
    "CCTV설치", "인터폰", "도어록",
  ],
  "법률·세무·회계": [
    "법무사", "변호사", "법률사무소", "법률상담",
    "세무사", "세무법인", "회계사", "회계법인",
    "관세사", "변리사", "특허사무소",
    "공인노무사", "노무법인", "행정사",
    "공증사무소", "법원경매",
  ],
  "금융·보험": [
    "은행", "증권사", "보험사", "보험대리점",
    "대출", "저축은행", "캐피탈", "새마을금고",
    "신협",
  ],
  "부동산": [
    "부동산", "공인중개사", "부동산컨설팅",
    "상가임대", "사무실임대", "원룸", "오피스텔",
  ],
  "IT·마케팅": [
    "홈페이지제작", "앱개발", "쇼핑몰제작",
    "광고대행사", "마케팅대행", "SNS마케팅",
    "블로그마케팅", "유튜브제작", "영상편집",
    "SEO", "키워드광고",
  ],
  "인쇄·디자인": [
    "인쇄소", "복사", "명함", "현수막", "간판",
    "스티커제작", "포장재", "판촉물",
    "디자인", "로고디자인", "웹디자인",
  ],
  "번역·통역": [
    "번역", "통역", "영어번역", "중국어번역", "일본어번역",
    "공증번역", "기술번역",
  ],
  "숙박·여행": [
    "호텔", "모텔", "펜션", "게스트하우스", "리조트",
    "캠핑장", "글램핑", "민박", "한옥스테이",
    "여행사", "항공사",
  ],
  "웨딩·촬영": [
    "웨딩홀", "웨딩플래너", "웨딩드레스", "예복",
    "웨딩촬영", "스튜디오촬영", "스냅사진",
    "사진관", "여권사진", "증명사진",
    "영상촬영", "드론촬영",
  ],
  "반려동물": [
    "동물병원", "애견미용", "펫샵", "애견호텔",
    "애견유치원", "반려동물장례", "애견훈련",
    "고양이카페", "애견카페",
  ],
  "꽃·화원": [
    "꽃집", "화원", "꽃배달", "조화", "화환",
    "플라워카페", "원예",
  ],
  "쇼핑·마트": [
    "마트", "슈퍼마켓", "대형마트", "백화점", "아울렛", "시장",
    "의류매장", "남성의류", "여성의류", "아동의류",
    "신발매장", "잡화점", "안경점", "시계점",
    "가구매장", "가전매장", "인테리어소품", "생활용품",
    "문구점", "서점", "화장품", "향수",
  ],
  "놀이·오락": [
    "노래방", "코인노래방", "PC방", "당구장",
    "키즈카페", "실내놀이터", "방탈출", "만화카페",
    "오락실", "VR체험", "사격장",
    "보드게임카페", "다트",
  ],
  "문화·예술": [
    "영화관", "공연장", "전시관", "미술관", "박물관",
    "도서관", "문화센터", "갤러리",
    "연극", "뮤지컬", "콘서트",
  ],
  "장례·상조": [
    "장례식장", "상조회사", "장의사", "화장장",
    "묘지", "납골당", "수목장",
  ],
  "농수산·축산": [
    "정육점", "수산물", "농산물", "과일가게",
    "반찬가게", "떡집", "두부", "건어물",
  ],
  "기타": [
    "유품정리업체", "정수기", "공기청정기",
  ],
};

// flat 리스트 (기존 호환)
const CATEGORIES = Object.values(CATEGORY_GROUPS).flat();

// 네이버 광고 API로 관련 키워드를 자동 조회하는 함수
async function fetchRelatedKeywords(query: string): Promise<{ keyword: string; totalSearches: number; competition: string }[]> {
  try {
    const res = await fetch("/api/keywords/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.keywords || [];
  } catch {
    return [];
  }
}

export default function ScrapePage() {
  // 자동 수집
  const [searchMode, setSearchMode] = useState<"category" | "custom">("category");
  const [categoryGroup, setCategoryGroup] = useState("병원·의료");
  const [category, setCategory] = useState("치과");
  const [customQuery, setCustomQuery] = useState("");
  const [region, setRegion] = useState("");
  const [target, setTarget] = useState(100);
  const [keywords, setKeywords] = useState("");  // 관련 키워드 (쉼표 구분)
  const [keywordLoading, setKeywordLoading] = useState(false); // 키워드 로딩 중
  const [keywordDetails, setKeywordDetails] = useState<{ keyword: string; totalSearches: number; competition: string }[]>([]);
  const [scraping, setScraping] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null); // 진행 상황 + 스킵 로그
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const keywordTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 자동 수집 모드
  const [autoMode, setAutoMode] = useState<{
    enabled: boolean;
    targetPerJob: number;
    nextCategory?: { category: string; lastScrapedAt: string | null } | null;
  } | null>(null);

  const fetchAutoMode = async () => {
    try {
      const res = await fetch("/api/scrape/auto-mode");
      const data = await res.json();
      setAutoMode(data);
    } catch {}
  };

  const toggleAutoMode = async () => {
    if (!autoMode) return;
    try {
      const res = await fetch("/api/scrape/auto-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !autoMode.enabled }),
      });
      setAutoMode(await res.json());
    } catch {}
  };

  useEffect(() => { fetchAutoMode(); }, []);

  // 카테고리/검색어 변경 시 네이버 API로 관련 키워드 자동 조회
  useEffect(() => {
    const query = searchMode === "custom" ? customQuery : category;
    if (!query || query.length < 2) {
      setKeywords(query);
      setKeywordDetails([]);
      return;
    }

    // 타이핑 중 과도한 API 호출 방지 (0.8초 대기 후 호출)
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    keywordTimerRef.current = setTimeout(async () => {
      setKeywordLoading(true);
      const results = await fetchRelatedKeywords(query);
      if (results.length > 0) {
        setKeywordDetails(results);
        // 원래 검색어 + 관련 키워드 (검색량 순)
        const kwList = results.map(r => r.keyword);
        // 원래 검색어가 목록에 없으면 맨 앞에 추가
        if (!kwList.includes(query)) kwList.unshift(query);
        setKeywords(kwList.join(", "));
      } else {
        setKeywordDetails([]);
        setKeywords(query);
      }
      setKeywordLoading(false);
    }, 800);

    return () => { if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current); };
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

          // 진행 상황도 함께 폴링
          if (data.job?.id) {
            try {
              const pres = await fetch(`/api/scrape/progress?jobId=${data.job.id}`);
              const pdata = await pres.json();
              setProgress(pdata);
            } catch {}
          }

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

  // 수집 시작 (또는 대기열 추가)
  const startScrape = async () => {
    const query = searchMode === "custom" ? customQuery : category;
    if (!query) {
      setResult({ error: "검색어 또는 카테고리를 선택하세요" });
      return;
    }
    const wasScraping = scraping; // 이미 수집 중이었는지
    if (!wasScraping) setScraping(true);
    setResult(null);

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
      if (!wasScraping) setScraping(false);
    } else if (data.queued) {
      setResult({ message: data.message });
      // 큐에 추가됐으면 기존 수집 진행 상태는 유지
      // 큐 목록도 새로고침
      fetch("/api/scrape/start").then(r => r.json()).then(d => {
        if (d.queue) setQueue(d.queue);
      });
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

      {/* 자동 수집 모드 토글 */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAutoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoMode?.enabled ? "bg-blue-600" : "bg-gray-700"
            }`}
            title={autoMode?.enabled ? "자동 모드 끄기" : "자동 모드 켜기"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                autoMode?.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-white">자동 수집 모드</span>
          <span className="text-xs text-gray-400 hidden md:inline">
            {autoMode?.enabled ? "큐 비면 가장 오래된 카테고리부터 자동 추가" : "OFF"}
          </span>
        </div>
        {autoMode?.nextCategory && (
          <div className="text-xs">
            <span className="text-gray-400">다음: </span>
            <span className="text-white font-medium">{autoMode.nextCategory.category}</span>
            {autoMode.nextCategory.lastScrapedAt && (
              <span className="text-gray-500 ml-2">
                (마지막 {new Date(autoMode.nextCategory.lastScrapedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })})
              </span>
            )}
          </div>
        )}
      </div>

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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          {searchMode === "category" ? (
            <>
              {/* 대분류 */}
              <select value={categoryGroup} onChange={e => {
                setCategoryGroup(e.target.value);
                const subs = CATEGORY_GROUPS[e.target.value] || [];
                if (subs.length > 0) setCategory(subs[0]);
              }} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                {Object.keys(CATEGORY_GROUPS).map(g => (
                  <option key={g} value={g}>{g} ({CATEGORY_GROUPS[g].length})</option>
                ))}
              </select>
              {/* 소분류 */}
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                {(CATEGORY_GROUPS[categoryGroup] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          ) : (
            <input value={customQuery} onChange={e => setCustomQuery(e.target.value)}
              placeholder="검색어 (예: 강남 자동차판금)"
              className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
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

          <button onClick={startScrape}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold">
            {scraping ? "대기열 추가" : "수집 시작"}
          </button>
          {scraping && (
            <button onClick={async () => {
              await fetch("/api/scrape/start", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stop" }) });
              setScraping(false); setJob(null); setResult({ message: "수집 중지됨" });
            }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
              중지
            </button>
          )}
          <button onClick={async () => {
            if (!confirm("히스토리를 리셋하면 이전에 수집한 업체도 다시 수집됩니다. 계속할까요?")) return;
            const res = await fetch("/api/scrape/start", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resetHistory" }) });
            const data = await res.json();
            setResult({ message: data.message || data.error });
          }} className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">
            히스토리 리셋
          </button>
        </div>

        {/* 관련 키워드 (네이버 API 자동 조회) */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm text-gray-400">관련 키워드 (네이버 API 자동 조회, 직접 수정 가능)</label>
            {keywordLoading && <span className="text-xs text-blue-400 animate-pulse">조회 중...</span>}
          </div>
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="카테고리나 검색어를 입력하면 자동으로 관련 키워드가 채워집니다"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500" />
          {keywordDetails.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {keywordDetails.slice(0, 10).map((kw, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 border border-gray-700">
                  <span className="text-white">{kw.keyword}</span>
                  <span className="text-gray-500">{kw.totalSearches.toLocaleString()}</span>
                  <span className={kw.competition === "높음" ? "text-red-400" : kw.competition === "중간" ? "text-yellow-400" : "text-green-400"}>
                    {kw.competition}
                  </span>
                </span>
              ))}
            </div>
          )}
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

            {/* 상세 진행 상황 */}
            {progress?.progress && (
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1">
                <div>현재 키워드: <span className="text-white">{progress.progress.currentKeyword || "-"}</span></div>
                <div>현재 지역: <span className="text-white">{progress.progress.currentRegion || "-"}</span></div>
                <div>처리 중인 업체: <span className="text-white">{progress.progress.currentBusiness || "-"}</span></div>
                <div>마지막 업데이트: <span className="text-white">
                  {progress.progress.lastUpdate ? `${Math.round((Date.now() - new Date(progress.progress.lastUpdate).getTime()) / 1000)}초 전` : "-"}
                </span></div>
                {progress.totalSkipped > 0 && (
                  <div className="text-yellow-400">
                    스킵된 업체: {progress.totalSkipped}개
                    {Object.keys(progress.skipSummary || {}).length > 0 && (
                      <span className="text-gray-500 ml-2">
                        ({Object.entries(progress.skipSummary).map(([r, c]: any) => `${r}: ${c}`).join(", ")})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
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
