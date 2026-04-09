"use client";
import { useState, useEffect } from "react";

export default function StatsPage() {
  const [funnel, setFunnel] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch(`/api/stats/funnel?days=${days}`).then(r => r.json()).then(setFunnel);
    fetch(`/api/stats/daily?days=14`).then(r => r.json()).then(d => setDaily(d.daily || []));
  }, [days]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">통계</h1>
          <p className="text-gray-400 mt-1">퍼널 & 일별 추이</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
          <option value={7}>7일</option><option value={14}>14일</option>
          <option value={30}>30일</option><option value={90}>90일</option>
        </select>
      </div>

      {/* 퍼널 */}
      {funnel && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">퍼널 ({days}일)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "발송", value: funnel.funnel.sent, rate: null, color: "text-white" },
              { label: "도달", value: funnel.funnel.delivered, rate: funnel.rates.deliveryRate, color: "text-blue-400" },
              { label: "열람", value: funnel.funnel.opened, rate: funnel.rates.openRate, color: "text-green-400" },
              { label: "클릭", value: funnel.funnel.clicked, rate: funnel.rates.clickRate, color: "text-yellow-400" },
              { label: "반송", value: funnel.funnel.bounced, rate: funnel.rates.bounceRate, color: "text-red-400" },
              { label: "답장", value: funnel.funnel.replied, rate: funnel.rates.replyRate, color: "text-purple-400" },
              { label: "수신거부", value: funnel.funnel.unsubscribed, rate: null, color: "text-gray-400" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value.toLocaleString()}</p>
                {item.rate !== null && <p className="text-xs text-gray-500 mt-1">{item.rate}%</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 퍼널 바 시각화 */}
      {funnel && funnel.funnel.sent > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">퍼널 시각화</h2>
          {[
            { label: "발송", value: funnel.funnel.sent, color: "bg-blue-500" },
            { label: "도달", value: funnel.funnel.delivered, color: "bg-blue-400" },
            { label: "열람", value: funnel.funnel.opened, color: "bg-green-500" },
            { label: "클릭", value: funnel.funnel.clicked, color: "bg-yellow-500" },
            { label: "답장", value: funnel.funnel.replied, color: "bg-purple-500" },
          ].map((item, i) => {
            const pct = (item.value / funnel.funnel.sent) * 100;
            return (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="w-12 text-xs text-gray-400 text-right">{item.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div className={`${item.color} h-full rounded-full flex items-center pl-2`}
                    style={{ width: `${Math.max(pct, 1)}%` }}>
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                </div>
                <span className="w-14 text-xs text-gray-500 text-right">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 일별 추이 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">일별 추이 (14일)</h2>
        {daily.length === 0 ? (
          <p className="text-gray-500 text-center py-4">데이터가 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-3 py-2 text-gray-400">날짜</th>
                  <th className="text-right px-3 py-2 text-gray-400">발송</th>
                  <th className="text-right px-3 py-2 text-gray-400">열람</th>
                  <th className="text-right px-3 py-2 text-gray-400">클릭</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map((d, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="px-3 py-2 text-gray-300">{d.date}</td>
                    <td className="px-3 py-2 text-right text-white">{d.sent}</td>
                    <td className="px-3 py-2 text-right text-green-400">{d.opened}</td>
                    <td className="px-3 py-2 text-right text-yellow-400">{d.clicked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
