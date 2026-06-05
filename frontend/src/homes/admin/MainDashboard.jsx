import React, { useState } from "react";
import { COMPANIES } from "@assets/data/masterData";
import Kpi from "@components/Common/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

const MainDashboard = () => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const certCount = COMPANIES.reduce((a, c) => a + (c.cert_count || 0), 0);
  const midRisk = COMPANIES.filter((c) => c.risk === "중위험").length;

  const runAi = () => {
    setAiLoading(true);
    setAiResult(null);
    setTimeout(() => {
      setAiLoading(false);
      setAiResult(
        "[AI 분석 완료 (2026-05-19)]\n\n[즉시 조치 (2건)]\n1. 케이알엠 FEOC 12.5% - IRA 세액공제 위험\n2. Comilog 산림파괴 리스크 - EUDR 비준수\n\n[모니터링 (2건)]\n3. Comilog TRIR 2.15 초과\n4. 실사 완료율 94%"
      );
    }, 2000);
  };

  const alerts = [
    { id: 1, type: "고위험", tier: "2차 협력사", company: "(주)케이알엠", date: "2026-05-18", msg: "FEOC 지분율 규정 위반 우려 지표 감지 (IRA 세액공제 원천 차단 위험 우려)" },
    { id: 2, type: "고위험", tier: "3차 협력사", company: "Comilog", date: "2026-05-17", msg: "원자재 채굴 지역 인근 산림 파괴 경보 보고 (EUDR 글로벌 환경 규제 비준수 리스크)" },
    { id: 3, type: "중위험", tier: "3차 협력사", company: "Comilog", date: "2026-05-16", msg: "총 가동 시간 대비 산업재해 기록율 TRIR 2.15 기준치 초과 (안전보건 관리 주의 요망)" },
    { id: 4, type: "중위험", tier: "1차 협력사", company: "(주)알루텍", date: "2026-05-15", msg: "공급망 자가진단 항목 중 내부 탄소 배출 가동 집계 실적 데이터 누락 발생 (실사 완료율 94% 정체)" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">ESG 공급망 메인 대시보드</h2>
        <p className="text-xs font-medium text-gray-400 mt-0.5">현대모비스 · 3003 합금 · 원청사→1·2차→3차 · CSRD/CSDDD/Net-Zero 2045</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Kpi label="공급망 등록 기업" value={(COMPANIES.length || 0) + "개사"} sub="1차 2개, 2차 2개, 3차 5개" icon="🏢" accent="bg-slate-800" />
        <Kpi label="인증 완료 기업" value={certCount + "개 인증"} sub="공급망 전체 보유 인증 합계" icon="📜" accent="bg-blue-600" />
        <Kpi label="리스크 관리" value={midRisk + "개사"} sub="중위험 (실사 지표 기준)" icon="⚠️" accent="bg-amber-500" />
        <Kpi label="Net-Zero 목표" value="2045년" sub="Green Supply 로드맵" icon="🌱" accent="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-5 flex flex-col h-[420px]">
            <CardHeader>
              <CardTitle>AI Agent 공급망 리스크 종합 실사</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-xs text-gray-500 leading-relaxed">
                글로벌 공급망 원자재 이력 및 협력사 정량 지표를 종합 분석하여 잠재적 규제 위반 요소를 실시간으로 추적합니다.
              </p>
              
              <div className="flex-1 my-3 bg-slate-50 border border-gray-100 rounded-xl p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-gray-700">
                {aiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="w-5 h-5 border-2 border-[#03a94d] border-t-transparent rounded-full animate-spin" />
                    <span>공급망 지표 정밀 실사 중...</span>
                  </div>
                ) : aiResult ? (
                  aiResult
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-center select-none py-10">
                    분석 시작 버튼을 누르면<br />AI 종합 관제 콘솔이 가동됩니다.
                  </div>
                )}
              </div>

              <button
                onClick={runAi}
                disabled={aiLoading}
                className="w-full py-2.5 bg-[#03a94d] hover:bg-[#02823b] disabled:bg-gray-200 text-white font-bold text-xs rounded-lg transition shadow-sm select-none"
              >
                {aiLoading ? "실사 분석 가동 중" : "AI 공급망 전체 분석 시작"}
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5 flex flex-col h-[420px]">
            <CardHeader>
              <CardTitle>AI Agent 리스크 실시간 알림 피드</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-1">
              {alerts.map((alert) => {
                const isHigh = alert.type === "고위험";
                const borderCls = isHigh ? "border-red-500 bg-red-50/40" : "border-amber-400 bg-amber-50/40";
                const dotCls = isHigh ? "text-red-500" : "text-amber-500";
                
                return (
                  <div key={alert.id} className={"flex items-start gap-3 p-3 rounded-lg border-l-4 transition hover:bg-white border " + borderCls}>
                    <span className={"text-base font-black shrink-0 select-none " + dotCls}>●</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">{alert.company}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500 font-semibold">{alert.tier}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 font-medium">{alert.date}</span>
                        <span className="ml-auto">
                          <RChip v={alert.type} />
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{alert.msg}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
