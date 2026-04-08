import crypto from "crypto";

const API_KEY = process.env.NAVER_ADS_API_KEY || "";
const SECRET_KEY = process.env.NAVER_ADS_SECRET || "";
const CUSTOMER_ID = process.env.NAVER_ADS_CUSTOMER_ID || "";

function generateSignature(timestamp: string, method: string, uri: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
}

export interface KeywordResult {
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalSearches: number;
  compIdx: string;
  competition: string;
}

// 연관 키워드 조회 (hintKeywords 1개 → 연관 키워드 다수 반환)
export async function getRelatedKeywords(keyword: string): Promise<KeywordResult[]> {
  const cleanKeyword = keyword.replace(/\s+/g, "");
  const timestamp = String(Date.now());
  const method = "GET";
  const uri = "/keywordstool";
  const signature = generateSignature(timestamp, method, uri);

  const params = new URLSearchParams({
    hintKeywords: cleanKeyword,
    showDetail: "1",
  });

  const response = await fetch(
    `https://api.naver.com${uri}?${params.toString()}`,
    {
      method,
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": API_KEY,
        "X-Customer": CUSTOMER_ID,
        "X-Signature": signature,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Naver Ads API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.keywordList || []).map(parseKeywordItem);
}

function parseKeywordItem(item: Record<string, unknown>): KeywordResult {
  const pcCount = typeof item.monthlyPcQcCnt === "number" ? item.monthlyPcQcCnt : parseInt(String(item.monthlyPcQcCnt)) || 0;
  const mobileCount = typeof item.monthlyMobileQcCnt === "number" ? item.monthlyMobileQcCnt : parseInt(String(item.monthlyMobileQcCnt)) || 0;
  const totalSearches = pcCount + mobileCount;

  let competition = "낮음";
  const compIdx = (item.compIdx as string) || "";
  if (compIdx === "HIGH") competition = "높음";
  else if (compIdx === "MEDIUM") competition = "중간";

  return {
    keyword: item.relKeyword as string,
    monthlyPcQcCnt: pcCount,
    monthlyMobileQcCnt: mobileCount,
    totalSearches,
    compIdx,
    competition,
  };
}
