"use client";

import { useState, useEffect } from "react";

interface CategoryInsight {
  category: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: string;
  clickRate: string;
  replyRate: string;
  grade: string;
}

interface TemplateInsight {
  id: string;
  name: string;
  subject: string;
  step: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: string;
  clickRate: string;
  replyRate: string;
}

interface StepInsight {
  step: number;
  stepLabel: string;
  sent: number;
  openRate: string;
  clickRate: string;
  replyRate: string;
}

interface Recommendation {
  type: string;
  title: string;
  detail: string;
}

interface InsightData {
  summary: {
    totalSends: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    overallOpenRate: string;
    overallClickRate: string;
    overallReplyRate: string;
  };
  categoryInsights: CategoryInsight[];
  templateInsights: TemplateInsight[];
  stepInsights: StepInsight[];
  recommendations: Recommendation[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/insights")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 p-8">로딩 중...</div>;
  if (!data) return <div className="text-red-400 p-8">데이터 로드 실패</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">발송 전 인사이트</h1>
        <p className="text-gray-400 mt-1">
          어떤 업종이 반응 좋은지, 어떤 이메일이 효과적인지 확인하고 다음 발송에 참고하세요
        </p>
      </div>

      {/* 추천 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.recommendations.map((rec, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${
              rec.type === "best_category"
                ? "bg-green-900/20 border-green-800"
                : rec.type === "best_template"
                ? "bg-blue-900/20 border-blue-800"
                : "bg-gray-900 border-gray-800"
            }`}
          >
            <p className="text-sm text-gray-400 mb-1">
              {rec.type === "best_category" ? "베스트 업종" :
               rec.type === "best_template" ? "베스트 템플릿" : "팁"}
            </p>
            <p className="text-white font-semibold">{rec.title}</p>
            <p className="text-gray-400 text-sm mt-1">{rec.detail}</p>
          </div>
        ))}
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="총 발송" value={data.summary.totalSends} />
        <SummaryCard label="열람률" value={`${data.summary.overallOpenRate}%`} color="text-blue-400" />
        <SummaryCard label="클릭률" value={`${data.summary.overallClickRate}%`} color="text-green-400" />
        <SummaryCard label="답장률" value={`${data.summary.overallReplyRate}%`} color="text-yellow-400" />
      </div>

      {/* 업종별 성과 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">업종별 반응 순위</h2>
        <p className="text-sm text-gray-500 mb-4">
          어떤 업종이 이메일을 잘 열고 클릭하는지 순위를 보여줍니다
        </p>
        {data.categoryInsights.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            아직 발송 데이터가 없습니다. 이메일을 보내면 여기서 업종별 성과를 볼 수 있어요.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-3 py-2 text-gray-400">순위</th>
                <th className="text-left px-3 py-2 text-gray-400">업종</th>
                <th className="text-center px-3 py-2 text-gray-400">등급</th>
                <th className="text-right px-3 py-2 text-gray-400">발송</th>
                <th className="text-right px-3 py-2 text-gray-400">열람률</th>
                <th className="text-right px-3 py-2 text-gray-400">클릭률</th>
                <th className="text-right px-3 py-2 text-gray-400">답장률</th>
              </tr>
            </thead>
            <tbody>
              {data.categoryInsights.map((cat, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2 text-white font-medium">{cat.category}</td>
                  <td className="px-3 py-2 text-center">
                    <GradeBadge grade={cat.grade} />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">{cat.sent}</td>
                  <td className="px-3 py-2 text-right text-blue-400">{cat.openRate}%</td>
                  <td className="px-3 py-2 text-right text-green-400">{cat.clickRate}%</td>
                  <td className="px-3 py-2 text-right text-yellow-400">{cat.replyRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 템플릿별 성과 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">이메일 제목별 효과</h2>
        <p className="text-sm text-gray-500 mb-4">
          어떤 제목/내용의 이메일이 가장 효과적인지 비교합니다
        </p>
        {data.templateInsights.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            아직 발송 데이터가 없습니다. 여러 템플릿으로 이메일을 보내면 비교 데이터가 쌓여요.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-3 py-2 text-gray-400">템플릿</th>
                <th className="text-left px-3 py-2 text-gray-400">제목</th>
                <th className="text-right px-3 py-2 text-gray-400">발송</th>
                <th className="text-right px-3 py-2 text-gray-400">열람률</th>
                <th className="text-right px-3 py-2 text-gray-400">클릭률</th>
                <th className="text-right px-3 py-2 text-gray-400">답장률</th>
              </tr>
            </thead>
            <tbody>
              {data.templateInsights.map((tpl) => (
                <tr key={tpl.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-3 py-2 text-white">{tpl.name}</td>
                  <td className="px-3 py-2 text-gray-300 max-w-xs truncate">{tpl.subject}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{tpl.sent}</td>
                  <td className="px-3 py-2 text-right text-blue-400">{tpl.openRate}%</td>
                  <td className="px-3 py-2 text-right text-green-400">{tpl.clickRate}%</td>
                  <td className="px-3 py-2 text-right text-yellow-400">{tpl.replyRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 단계별 성과 */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">발송 단계별 비교</h2>
        <p className="text-sm text-gray-500 mb-4">
          1차 vs 2차 vs 3차 vs 4차 중 어떤 단계가 효과적인지 비교합니다
        </p>
        {data.stepInsights.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            아직 발송 데이터가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.stepInsights.map((step) => (
              <div key={step.step} className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-white">{step.stepLabel}</p>
                <p className="text-sm text-gray-400 mt-2">발송 {step.sent}건</p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm">열람 <span className="text-blue-400 font-semibold">{step.openRate}%</span></p>
                  <p className="text-sm">클릭 <span className="text-green-400 font-semibold">{step.clickRate}%</span></p>
                  <p className="text-sm">답장 <span className="text-yellow-400 font-semibold">{step.replyRate}%</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-white" }: {
  label: string; value: string | number; color?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const styles: Record<string, string> = {
    S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    A: "bg-green-500/20 text-green-400 border-green-500/30",
    B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    C: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[grade] || styles.C}`}>
      {grade}
    </span>
  );
}
