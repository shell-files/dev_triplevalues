import React from "react";
import { KpiCard } from "@components/Common/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";
import { NOTIFICATIONS } from "@assets/masterData";

const MainDashboard = () => {
  const adminNotifs = NOTIFICATIONS.filter((n) => n.role === "현대모비스" || !n.role);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">ESG 공급망 메인 대시보드</h2>
        <p className="text-xs font-medium text-gray-400 mt-0.5">현대모비스 · 3003 합금 · 원청사→1·2차→3차 · CSRD/CSDDD/Net-Zero 2045</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard subtext="1차 2개, 2차 2개, 3차 5개" title="공급망 등록 기업" value="9개사"/>
        <KpiCard subtext="공급망 전체 보유 인증 합계" title="인증 완료 기업" value="17개 인증"/>
        <KpiCard subtext="중위험 (실사 지표 기준)" title="리스크 관리" trend="주의" trendType="warn" value="7개사"/>
        <KpiCard subtext="Green Supply 로드맵" title="Net-Zero 목표" value="2045년"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[400px] flex flex-col justify-between">
            <CardHeader>
              <CardTitle>공급망 데이터 시각화 분석</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400">9-d단계에서 Recharts 차트 인터랙션 엔진이 융합될 영역입니다.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>협력사 종합 ESG 스코어</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400">9-d단계에서 레이더 시각화 차트가 융합될 영역입니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Agent 리스크 실시간 알림</CardTitle>
          <button className="px-3 py-1.5 bg-[#03a94d] hover:bg-[#02823b] text-white text-xs font-bold rounded-lg transition">
            AI 전체 분석
          </button>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
          {adminNotifs.map((n) => {
            const isHigh = n.level === "fail";
            return (
              <div key={n.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex gap-3 items-start min-w-0">
                  <span className={(isHigh ? "text-red-500" : "text-amber-500") + " text-sm mt-0.5 shrink-0"}>●</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                      <span className="text-[11px] text-gray-400 font-medium">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.msg}</p>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <RChip v={isHigh ? "고위험" : (n.level === "warn" ? "중위험" : "저위험")} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainDashboard;
