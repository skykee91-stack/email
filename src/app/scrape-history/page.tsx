"use client";
import { useState, useEffect } from "react";

interface ScrapeJob {
  id: string;
  region: string;
  category: string;
  mode: string;
  maxResults: number;
  status: string;
  totalFound: number;
  totalSaved: number;
  withEmail: number;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Stats {
  totalJobs: number;
  doneJobs: number;
  failedJobs: number;
  totalFound: number;
  totalSaved: number;
  totalWithEmail: number;
}

export default function ScrapeHistoryPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [skipModal, setSkipModal] = useState<any>(null); // 스킵 로그 모달

  const openSkipModal = async (job: ScrapeJob) => {
    const res = await fetch(`/api/scrape/progress?jobId=${job.id}`);
    const data = await res.json();
    setSkipModal({ job, ...data });
  };

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/scrape/jobs?${params}`);
    const data = await res.json();
    const newJobs = data.jobs || [];
    // 데이터 바뀔 때만 업데이트 (깜빡임 방지)
    if (JSON.stringify(newJobs) !== JSON.stringify(jobs)) {
      setJobs(newJobs);
    }
    if (data.stats) setStats(data.stats);
    setTotalPages(data.pagination?.totalPages || 1);
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [page, statusFilter]);

  // 5초마다 조용히 갱신 (깜빡임 없이)
  useEffect(() => {
    const interval = setInterval(() => fetchJobs(true), 5000);
    return () => clearInterval(interval);
  }, [page, statusFilter, jobs]);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const duration = (start: string | null, end: string | null) => {
    if (!start || !end) return "-";
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}초`;
    return `${Math.floor(diff / 60)}분 ${Math.round(diff % 60)}초`;
  };

  const emailRate = (withEmail: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((withEmail / total) * 100)}%`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">수집 이력</h1>
        <p className="text-gray-400 mt-1">지금까지 수집한 작업 기록을 확인합니다</p>
      </div>

      {/* 전체 통계 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="총 수집 작업" value={stats.totalJobs} />
          <StatCard label="성공" value={stats.doneJobs} color="text-green-400" />
          <StatCard label="실패" value={stats.failedJobs} color="text-red-400" />
          <StatCard label="발견 업체" value={stats.totalFound.toLocaleString()} />
          <StatCard label="저장 업체" value={stats.totalSaved.toLocaleString()} color="text-blue-400" />
          <StatCard label="이메일 보유" value={stats.totalWithEmail.toLocaleString()} color="text-purple-400" />
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {["", "done", "failed", "running", "pending"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {s === "" ? "전체" : s === "done" ? "성공" : s === "failed" ? "실패" : s === "running" ? "진행중" : "대기"}
          </button>
        ))}
      </div>

      {/* 이력 테이블 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400">검색어/업종</th>
              <th className="text-left px-4 py-3 text-gray-400">지역</th>
              <th className="text-left px-4 py-3 text-gray-400">상태</th>
              <th className="text-left px-4 py-3 text-gray-400">발견</th>
              <th className="text-left px-4 py-3 text-gray-400">저장</th>
              <th className="text-left px-4 py-3 text-gray-400">이메일</th>
              <th className="text-left px-4 py-3 text-gray-400">소요시간</th>
              <th className="text-left px-4 py-3 text-gray-400">일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">불러오는 중...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">수집 이력이 없습니다</td></tr>
            ) : jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer" onClick={() => openSkipModal(job)} title="클릭하면 진행 상황 + 스킵 로그">
                <td className="px-4 py-3">
                  <span className="text-white font-medium">{job.category}</span>
                  <span className="text-gray-500 text-xs ml-1">(목표 {job.maxResults}개)</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{job.region || "전국"}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3 text-gray-300">{job.totalFound}</td>
                <td className="px-4 py-3 text-blue-400 font-semibold">{job.totalSaved}</td>
                <td className="px-4 py-3">
                  <span className="text-purple-400">{job.withEmail}</span>
                  <span className="text-gray-500 text-xs ml-1">({emailRate(job.withEmail, job.totalSaved)})</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{duration(job.startedAt, job.finishedAt)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(job.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded text-xs disabled:opacity-50">이전</button>
          <span className="px-3 py-1.5 text-gray-400 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded text-xs disabled:opacity-50">다음</button>
        </div>
      )}

      {/* 스킵 로그 모달 */}
      {skipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSkipModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold">{skipModal.job?.category} 진행 상세</h3>
                <p className="text-gray-400 text-xs mt-1">
                  {skipModal.job?.region || '전국'} | {skipModal.job?.status} | 발견 {skipModal.job?.totalFound} / 저장 {skipModal.job?.totalSaved}
                </p>
              </div>
              <button onClick={() => setSkipModal(null)} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
            </div>

            {/* 진행 상황 */}
            {skipModal.progress && (
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30 text-xs space-y-1">
                <div className="text-gray-400">마지막 처리: <span className="text-white">{skipModal.progress.currentBusiness || '-'}</span></div>
                <div className="text-gray-400">키워드 / 지역: <span className="text-white">{skipModal.progress.currentKeyword || '-'} / {skipModal.progress.currentRegion || '-'}</span></div>
                <div className="text-gray-400">총 스킵: <span className="text-yellow-400">{skipModal.progress.totalSkipped || 0}건</span></div>
              </div>
            )}

            {/* 스킵 사유별 요약 */}
            {Object.keys(skipModal.skipSummary || {}).length > 0 && (
              <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap gap-2">
                {Object.entries(skipModal.skipSummary).map(([reason, count]: any) => (
                  <span key={reason} className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded">
                    {reason}: {count}건
                  </span>
                ))}
              </div>
            )}

            {/* 스킵 로그 목록 */}
            <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {(!skipModal.skipLogs || skipModal.skipLogs.length === 0) ? (
                <p className="text-gray-500 text-center py-8 text-sm">스킵된 업체가 없습니다</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-2 text-gray-500">업체명</th>
                      <th className="text-left px-4 py-2 text-gray-500">키워드</th>
                      <th className="text-left px-4 py-2 text-gray-500">지역</th>
                      <th className="text-left px-4 py-2 text-gray-500">사유</th>
                      <th className="text-left px-4 py-2 text-gray-500">시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skipModal.skipLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-800/50">
                        <td className="px-4 py-2 text-white">{log.businessName || '-'}</td>
                        <td className="px-4 py-2 text-gray-300">{log.keyword}</td>
                        <td className="px-4 py-2 text-gray-300">{log.region}</td>
                        <td className="px-4 py-2 text-yellow-400">{log.reason}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(log.skippedAt).toLocaleTimeString("ko-KR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    pending: { bg: "bg-gray-500/20 text-gray-400", label: "대기" },
    running: { bg: "bg-yellow-500/20 text-yellow-400", label: "진행중" },
    done: { bg: "bg-green-500/20 text-green-400", label: "성공" },
    failed: { bg: "bg-red-500/20 text-red-400", label: "실패" },
  };
  const s = map[status] || { bg: "bg-gray-500/20 text-gray-400", label: status };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.bg}`}>{s.label}</span>;
}
