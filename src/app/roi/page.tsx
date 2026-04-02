"use client";
import { useState, useEffect } from "react";

export default function ROIPage() {
  const [roi, setRoi] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [dealForm, setDealForm] = useState({ businessId: "", stage: "replied", amount: "", notes: "" });
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showDealForm, setShowDealForm] = useState(false);

  useEffect(() => {
    fetch(`/api/roi?days=${days}`).then(r => r.json()).then(setRoi);
    fetch("/api/businesses?limit=200").then(r => r.json()).then(d => setBusinesses(d.businesses || []));
  }, [days]);

  const addDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/roi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dealForm, amount: dealForm.amount ? Number(dealForm.amount) : null }),
    });
    setShowDealForm(false);
    setDealForm({ businessId: "", stage: "replied", amount: "", notes: "" });
    fetch(`/api/roi?days=${days}`).then(r => r.json()).then(setRoi);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">ROI 측정</h1>
          <p className="text-gray-400 mt-1">투자 대비 수익률</p>
        </div>
        <div className="flex gap-3">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
            <option value={7}>7일</option><option value={30}>30일</option>
            <option value={90}>90일</option><option value={365}>1년</option>
          </select>
          <button onClick={() => setShowDealForm(!showDealForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            + 거래 등록
          </button>
        </div>
      </div>

      {showDealForm && (
        <form onSubmit={addDeal} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">업체</label>
              <select value={dealForm.businessId} onChange={(e) => setDealForm({ ...dealForm, businessId: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                <option value="">선택</option>
                {businesses.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">단계</label>
              <select value={dealForm.stage} onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                <option value="replied">답장</option><option value="meeting">미팅</option><option value="contracted">계약</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">금액 (원)</label>
              <input type="number" value={dealForm.amount} onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="500000" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">메모</label>
              <input value={dealForm.notes} onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">등록</button>
        </form>
      )}

      {roi && (
        <>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="ROI" value={`${roi.metrics.roi.toFixed(1)}%`} color={roi.metrics.roi > 0 ? "text-green-400" : "text-red-400"} />
            <MetricCard label="총 매출" value={`${roi.revenue.total.toLocaleString()}원`} color="text-green-400" />
            <MetricCard label="총 비용" value={`${roi.costs.total.toLocaleString()}원`} color="text-red-400" />
            <MetricCard label="CAC" value={roi.metrics.cac > 0 ? `${Math.round(roi.metrics.cac).toLocaleString()}원` : "-"} color="text-yellow-400" />
          </div>

          {/* 퍼널 숫자 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">전환 퍼널 ({days}일)</h2>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {[
                { label: "발송", value: roi.funnel.sent },
                { label: "도달", value: roi.funnel.delivered },
                { label: "열람", value: roi.funnel.opened },
                { label: "클릭", value: roi.funnel.clicked },
                { label: "답장", value: roi.funnel.replied },
                { label: "미팅", value: roi.funnel.meetings },
                { label: "계약", value: roi.funnel.contracts },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 전환율 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">전환율</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RateCard label="도달률" rate={roi.rates.deliveryRate} />
              <RateCard label="열람률" rate={roi.rates.openRate} />
              <RateCard label="클릭률" rate={roi.rates.clickRate} />
              <RateCard label="답장률" rate={roi.rates.replyRate} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function RateCard({ label, rate }: { label: string; rate: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-white">{rate.toFixed(1)}%</p>
      <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  );
}
