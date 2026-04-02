// 메인 대시보드 페이지
// 나중에 실제 DB 데이터로 교체할 예정

export default function Dashboard() {
  // 임시 데이터 (아직 DB 연결 전이라 하드코딩)
  const stats = {
    totalBusinesses: 0,
    withEmail: 0,
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    hotLeads: 0,
  };

  return (
    <div>
      {/* 페이지 제목 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <p className="text-gray-400 mt-1">영업 이메일 자동화 현황</p>
      </div>

      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="수집 업체" value={stats.totalBusinesses} sub="총 업체 수" color="blue" />
        <KPICard title="이메일 보유" value={stats.withEmail} sub="이메일 있는 업체" color="green" />
        <KPICard title="총 발송" value={stats.totalSent} sub="이메일 발송 수" color="purple" />
        <KPICard title="핫 리드" value={stats.hotLeads} sub="S+A 티어" color="red" />
      </div>

      {/* 퍼널 카드들 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">퍼널 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FunnelCard label="발송" value={stats.totalSent} rate={null} />
          <FunnelCard label="도달" value={stats.delivered} rate={stats.totalSent > 0 ? (stats.delivered / stats.totalSent * 100) : 0} />
          <FunnelCard label="열람" value={stats.opened} rate={stats.delivered > 0 ? (stats.opened / stats.delivered * 100) : 0} />
          <FunnelCard label="클릭" value={stats.clicked} rate={stats.opened > 0 ? (stats.clicked / stats.opened * 100) : 0} />
          <FunnelCard label="답장" value={stats.replied} rate={stats.totalSent > 0 ? (stats.replied / stats.totalSent * 100) : 0} />
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">시스템 상태</h2>
        <div className="space-y-3">
          <StatusRow label="DB 연결" status="pending" detail="Supabase 연결 필요" />
          <StatusRow label="스크래퍼" status="pending" detail="아직 미구축" />
          <StatusRow label="이메일 발송" status="pending" detail="Brevo API 연동 필요" />
          <StatusRow label="팔로업 스케줄러" status="pending" detail="아직 미구축" />
        </div>
      </div>
    </div>
  );
}

// ─── KPI 카드 컴포넌트 ───
function KPICard({ title, value, sub, color }: {
  title: string; value: number; sub: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500 text-blue-400",
    green: "border-green-500 text-green-400",
    purple: "border-purple-500 text-purple-400",
    red: "border-red-500 text-red-400",
  };

  return (
    <div className={`bg-gray-900 rounded-lg border-l-4 ${colorMap[color]} p-5`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

// ─── 퍼널 카드 컴포넌트 ───
function FunnelCard({ label, value, rate }: {
  label: string; value: number; rate: number | null;
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
      {rate !== null && (
        <p className="text-xs text-gray-500 mt-1">{rate.toFixed(1)}%</p>
      )}
    </div>
  );
}

// ─── 상태 표시 컴포넌트 ───
function StatusRow({ label, status, detail }: {
  label: string; status: "ok" | "pending" | "error"; detail: string;
}) {
  const statusMap = {
    ok: { dot: "bg-green-500", text: "정상" },
    pending: { dot: "bg-yellow-500", text: "대기" },
    error: { dot: "bg-red-500", text: "오류" },
  };

  const s = statusMap[status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
        <span className="text-sm text-white">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{detail}</span>
        <span className="text-xs text-gray-400">{s.text}</span>
      </div>
    </div>
  );
}
