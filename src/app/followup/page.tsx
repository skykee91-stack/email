"use client";
import { useState, useEffect } from "react";

interface StepInfo {
  step: number;
  label: string;
  delayDays: number;
  pendingCount: number;
  sentCount: number;
  description: string;
}

export default function FollowupPage() {
  const [overview, setOverview] = useState<{ firstSent: number; totalReplied: number; steps: StepInfo[] } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [sendStatus, setSendStatus] = useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/followup/auto").then(r => r.json()).catch(() => null),
      fetch("/api/sender-profiles").then(r => r.json()).catch(() => null),
    ]).then(([overviewData, profileData]) => {
      if (overviewData) setOverview(overviewData);
      if (profileData?.profiles) {
        setProfiles(profileData.profiles);
        const def = profileData.profiles.find((p: any) => p.isDefault);
        if (def) setSelectedProfile(def.id);
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  // 발송 상태 3초마다 폴링 (일반 발송 + 팔로업 공통)
  useEffect(() => {
    const tick = () => {
      fetch("/api/email/send").then(r => r.json()).then(setSendStatus).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  const currentJob = sendStatus?.sendJob;
  const isBusy = currentJob?.status === "running";

  // 팔로업 자동 실행
  const runFollowup = async (dryRun: boolean) => {
    setRunning(true);
    setResult(null);
    const res = await fetch("/api/followup/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun, delaySeconds }),
    });
    const data = await res.json();
    setResult(data);
    setRunning(false);
    if (!dryRun) fetchData();
  };

  const totalPending = overview?.steps?.reduce((s, st) => s + st.pendingCount, 0) || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">팔로업 자동화</h1>
        <p className="text-gray-400 mt-1">답장 없는 업체에 자동으로 후속 이메일을 보냅니다</p>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
          {/* 전체 현황 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="1차 발송 완료" value={overview?.firstSent || 0} color="text-blue-400" />
            <StatCard label="답장 받음" value={overview?.totalReplied || 0} color="text-green-400" />
            <StatCard label="팔로업 대기" value={totalPending} color="text-yellow-400" />
            <StatCard label="팔로업 진행률" value={
              overview?.firstSent
                ? `${Math.round(((overview.steps?.reduce((s, st) => s + st.sentCount, 0) || 0) / Math.max(overview.firstSent, 1)) * 100)}%`
                : "0%"
            } color="text-purple-400" />
          </div>

          {/* 단계별 파이프라인 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">발송 파이프라인</h2>
            <div className="space-y-4">
              {/* 1차 */}
              <PipelineRow
                step={1} label="1차 제안서" delay="최초"
                sent={overview?.firstSent || 0} pending={0}
                active={true}
              />
              {/* 2~4차 */}
              {overview?.steps?.map(s => (
                <PipelineRow
                  key={s.step} step={s.step} label={s.label}
                  delay={`${s.delayDays}일 후`}
                  sent={s.sentCount} pending={s.pendingCount}
                  active={s.pendingCount > 0}
                />
              ))}
            </div>

            {/* 설명 */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <span className="text-white font-medium">자동 팔로업 규칙:</span><br />
                1차 발송 → 3일 후 답장 없으면 2차 → 7일 후 3차 → 14일 후 4차 (마지막)<br />
                답장한 업체는 자동으로 제외됩니다.
              </p>
            </div>
          </div>

          {/* 팔로업 실행 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">팔로업 실행</h2>

            {totalPending === 0 && overview?.firstSent === 0 ? (
              <p className="text-gray-500 text-center py-4">
                아직 1차 이메일을 보내지 않았습니다. 먼저 이메일 발송 페이지에서 1차 발송을 해주세요.
              </p>
            ) : totalPending === 0 ? (
              <p className="text-gray-500 text-center py-4">
                현재 팔로업 대상이 없습니다. 1차 발송 후 설정된 기간이 지나면 대상이 생깁니다.
              </p>
            ) : (
              <>
                {/* 카테고리별 대기 현황 */}
                <div className="mb-4 space-y-2">
                  {overview?.steps?.filter(s => s.pendingCount > 0).map(s => (
                    <div key={s.step}>
                      {(s as any).byCategory?.map((cat: any) => (
                        <div key={cat.category} className="p-3 bg-gray-800/50 rounded-lg mb-2">
                          <p className="text-white text-sm font-medium mb-1">
                            {s.step}차 — {cat.category === 'default' ? '기본' : cat.category} ({cat.count}건)
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cat.businessCategories?.map((bc: any) => (
                              <span key={bc.name} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                {bc.name} {bc.count}건
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            1차 발신 프로필에 맞는 {s.step}차 템플릿+발신자로 자동 발송됩니다
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* 발송 간격 선택 */}
                <div className="mb-4 flex items-center gap-3">
                  <label className="text-sm text-gray-300">발송 간격</label>
                  <select
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(Number(e.target.value))}
                    disabled={isBusy}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm disabled:opacity-50"
                  >
                    <option value={5}>5초 (안전)</option>
                    <option value={10}>10초</option>
                    <option value={30}>30초 (매우 안전)</option>
                  </select>
                  <span className="text-xs text-gray-500">
                    {totalPending}건 × {delaySeconds}초 ≈ 약 {Math.ceil((totalPending * delaySeconds) / 60)}분 소요
                  </span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => runFollowup(true)} disabled={running || isBusy}
                    className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm font-semibold">
                    미리보기
                  </button>
                  <button onClick={() => runFollowup(false)} disabled={running || isBusy}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
                    {isBusy
                      ? (currentJob?.kind === "followup" ? "팔로업 발송 중..." : "다른 발송 진행 중...")
                      : running ? "요청 중..." : `팔로업 실행 (${totalPending}건)`}
                  </button>
                </div>

                {/* 진행 상황 표시 */}
                {currentJob && (
                  <div className="mt-4 p-4 bg-gray-800/70 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {currentJob.kind === "followup" ? "팔로업 발송" : "일반 발송"} — {currentJob.status === "running" ? "진행 중" : currentJob.status === "done" ? "완료" : "실패"}
                      </span>
                      <span className="text-xs text-gray-400">{currentJob.templateName}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((currentJob.sent + currentJob.skipped) / Math.max(currentJob.totalTargets, 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {currentJob.sent + currentJob.skipped} / {currentJob.totalTargets} (발송 {currentJob.sent}, 스킵 {currentJob.skipped})
                    </div>
                    {sendStatus?.queueLength > 0 && (
                      <div className="text-xs text-yellow-400 mt-1">대기열 {sendStatus.queueLength}개</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 실행 결과 */}
          {result && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {result.dryRun ? "미리보기 결과" : "실행 결과"}
              </h2>
              <p className="text-green-400 mb-4">{result.summary?.message}</p>
              <div className="space-y-3">
                {result.steps?.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        {s.step}차 — {s.category === 'default' ? '기본' : s.category || ''}
                        {s.templateName && <span className="text-gray-500 text-xs ml-2">({s.templateName})</span>}
                      </span>
                      <span className="text-sm text-gray-400">
                        대상 {s.candidates}명
                        {!result.dryRun && ` / 발송 ${s.sent}건`}
                      </span>
                    </div>
                    {result.dryRun && s.targets?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {s.targets.slice(0, 5).map((t: any, i: number) => (
                          <p key={i} className="text-xs text-gray-500">{t.name} ({t.email}) {t.businessCategory && `[${t.businessCategory}]`}</p>
                        ))}
                        {s.targets.length > 5 && (
                          <p className="text-xs text-gray-600">... 외 {s.targets.length - 5}명</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function PipelineRow({ step, label, delay, sent, pending, active }: {
  step: number; label: string; delay: string; sent: number; pending: number; active: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg ${active ? "bg-gray-800/50" : "bg-gray-800/20"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
        ${sent > 0 ? "bg-blue-600 text-white" : pending > 0 ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-400"}`}>
        {step}차
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{delay}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-white">{sent}건 발송</p>
        {pending > 0 && <p className="text-xs text-yellow-400">{pending}건 대기</p>}
      </div>
    </div>
  );
}
