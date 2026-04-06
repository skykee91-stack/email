"use client";

import { useState, useEffect, useCallback } from "react";

// 업체 데이터 타입
interface Business {
  id: string;
  name: string;
  phone: string | null;
  personalPhone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  region: string | null;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0, withEmail: 0, withPhone: 0, active: 0, bounced: 0, unsubscribed: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 업체 목록 가져오기
  const fetchBusinesses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses);
      setPagination(data.pagination);
    } catch (err) {
      console.error("업체 목록 조회 실패:", err);
    }
    setLoading(false);
  }, [search]);

  // 통계 가져오기
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/businesses/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("통계 조회 실패:", err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    fetchStats();
  }, [fetchBusinesses]);

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses(1);
  };

  return (
    <div>
      {/* 제목 + 엑셀 다운로드 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">업체 목록</h1>
          <p className="text-gray-400 mt-1">수집된 업체 데이터 관리</p>
        </div>
        <a href="/api/businesses/export"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold">
          엑셀 다운로드
        </a>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="전체" value={stats.total} />
        <StatCard label="이메일 보유" value={stats.withEmail} color="text-green-400" />
        <StatCard label="전화 보유" value={stats.withPhone} color="text-blue-400" />
        <StatCard label="활성" value={stats.active} color="text-emerald-400" />
        <StatCard label="반송" value={stats.bounced} color="text-red-400" />
        <StatCard label="수신거부" value={stats.unsubscribed} color="text-yellow-400" />
      </div>

      {/* 검색바 */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업체명 검색..."
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 업체 테이블 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">업체명</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">이메일</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">전화번호</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">업종</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">지역</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">수집일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    수집된 업체가 없습니다. 수집 관리에서 스크래핑을 시작하세요!
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => (
                  <tr key={biz.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white font-medium">{biz.name}</td>
                    <td className="px-4 py-3 text-gray-300">{biz.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-300">{biz.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-400">{biz.category || "-"}</td>
                    <td className="px-4 py-3 text-gray-400">{biz.region || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={biz.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(biz.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              총 {pagination.total.toLocaleString()}개 중 {((pagination.page - 1) * pagination.limit) + 1}~
              {Math.min(pagination.page * pagination.limit, pagination.total)}개
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchBusinesses(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchBusinesses(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 통계 카드 ───
function StatCard({ label, value, color = "text-white" }: {
  label: string; value: number; color?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

// ─── 상태 배지 ───
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    bounced: "bg-red-500/20 text-red-400",
    unsubscribed: "bg-yellow-500/20 text-yellow-400",
  };

  const labels: Record<string, string> = {
    active: "활성",
    bounced: "반송",
    unsubscribed: "수신거부",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {labels[status] || status}
    </span>
  );
}
