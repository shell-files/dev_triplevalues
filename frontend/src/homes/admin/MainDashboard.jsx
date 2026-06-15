import React, { useState, useEffect, useRef } from "react";
import { COMPANIES } from "@assets/data/masterData";
import Kpi from "@components/Common/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

// 신설 폴더 경로인 @components/Common/Icons/ 에서 7종의 컴포넌트형 아이콘 임포트
import Company from "@components/Common/Icons/Company";
import Auth from "@components/Common/Icons/Auth";
import Risk from "@components/Common/Icons/Risk";
import Goal from "@components/Common/Icons/Goal";
import AlertOctagon from "@components/Common/Icons/AlertOctagon";
import AlertCircle from "@components/Common/Icons/AlertCircle";
import CircleIcon from "@components/Common/Icons/CircleIcon";

const MainDashboard = () => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // ────────────────────────────────────────────────────────────
  // 🚨 [실시간 인프라 추가] Airflow 가 밀어주는 리스크 알림 피드 상태 관리
  // ────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState([
    {
      id: 999,
      company: "동양알루미늄",
      tier: "1차 협력사",
      date: "방금 전",
      type: "중위험",
      msg: "기본 세션 연결 대기 중... Airflow 파이프라인이 구동되면 실시간 피드가 동적 갱신됩니다."
    }
  ]);
  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const wsRef = useRef(null);

  // 백엔드 주소 및 테스트 마스터 UUID (getPartnerIdFromUuid 우회용)
  const token = "3fc1aaa0f88a4c61ba25f41ac42d33a4"
  // const WS_URL = `ws://localhost:8000/ws?token=${token}`;
  // ⚡ [수정] localhost 대신 실제 아이피를 사용하고 포트를 8001로 변경
  const WS_URL = `ws://${window.location.hostname}:8001/ws?token=${token}`;


  useEffect(() => {
    // 🔌 1. 화면 진입 시 웹소켓 관제 룸 연결 (MAIN_HQ 방 진입)
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("CONNECTED");
      console.log("🟢 [웹소켓] Airflow 실시간 관제 라인 연결 완료");
    };

    ws.onmessage = (event) => {
      try {
        const rawPacket = JSON.parse(event.data);
        console.log("📥 [웹소켓 수신]:", rawPacket);

        // 💡 단건 전송이든, 대용량 배치 전송이든 안전하게 가드 통과
        if (rawPacket.type === "tv") {
          console.log("받은 데이터:", rawPacket.data);
          // 케이스 A: Airflow가 리스트(배치)로 묶어서 한 번에 보낸 경우
          if (rawPacket.data?.is_batch && Array.isArray(rawPacket.data.data)) {
            const newAlerts = rawPacket.data.data.map((packet) => {
              const dashboardAlert = packet.data.aiAgent.dashboardAlert;
              return {
                id: dashboardAlert.id,
                company: dashboardAlert.company || "알 수 없는 협력사",
                tier: dashboardAlert.tier,
                date: "방금 전",
                type: dashboardAlert.type,
                msg: dashboardAlert.msg
              };
            });

            // 🚀 기존 피드 맨 위에 새로운 알람 배열 전체를 한 번에 결합 (풀림 현상 방지)
            setAlerts((prev) => [...newAlerts, ...prev]);
          }

          // 케이스 B: 기존 스타일의 단건 알림인 경우 (예외 가드 보존)
          else if (rawPacket.data?.type === "REALTIME_COMBINED_ALERT") {
            const combinedData = rawPacket.data.data;
            const dashboardAlert = combinedData.aiAgent.dashboardAlert;

            const newRealtimeAlert = {
              id: dashboardAlert.id || Date.now(),
              company: dashboardAlert.company || "알 수 없는 협력사",
              tier: dashboardAlert.tier,
              date: "방금 전",
              type: dashboardAlert.type,
              msg: dashboardAlert.msg
            };

            setAlerts((prev) => [newRealtimeAlert, ...prev]);
          }
        }
      } catch (err) {
        console.error("❌ 웹소켓 패킷 파싱 에러:", err);
      }
    };

    ws.onclose = () => {
      setWsStatus("DISCONNECTED");
      console.log("🔴 [웹소켓] 연결 종료");
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // 오리지널 데이터 연산 로직 완벽 보존
  const certCount = COMPANIES.reduce((a, c) => a + (c.cert_count || 0), 0);
  const midRisk = COMPANIES.filter((c) => c.risk === "중위험").length;

  const runAi = () => {
    setAiLoading(true);
    setAiResult(null);
    setTimeout(() => {
      setAiLoading(false);
      setAiResult(
        "[AI 분석 완료 (2026-04-15)]\n" +
        "----------------------------------------\n" +
        "1. 대상: 글로벌 알루미늄 Upstream 공급망 전체\n" +
        "2. 탐지: FEOC 우회 지분 위반 의심 1건 (Tier-2 협력사)\n" +
        "3. 조치 권고: 해당 공급처 대상 정밀 원산지 추적 및 자가진단 재요청"
      );
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full">
      {/* 💡 상단 타이틀 영역: 기존 구조를 유지하면서 우측에 실시간 소켓 상태 배지를 조화롭게 배치 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">대시보드</h2>
          <p className="text-sm text-gray-400 mt-0.5">현대모비스 Scope 3 공급망 및 글로벌 ESG 규제(CSRD, CSDDD, Net-Zero 2045) 대응 통합 관제 시스템입니다.</p>
        </div>
        {/* 🟢 기존 Tailwind 디자인 스타일에 부합하는 웹소켓 연결 상태 배지 인디케이터 */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 self-start sm:self-center shrink-0 select-none">
          <span className={`w-2 h-2 rounded-full ${wsStatus === "CONNECTED" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
          <span className="text-xs font-bold text-gray-600">Airflow 관제 피드 소켓: {wsStatus}</span>
        </div>
      </div>

      {/* KPI 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Kpi label="공급망 등록 기업" value={(COMPANIES.length || 0) + "개사"} sub="1차 2개, 2차 2개, 3차 5개" icon={<Company color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="인증 완료 기업" value={certCount + "개 인증"} sub="공급망 전체 보유 인증 합계" icon={<Auth color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="리스크 관리" value={midRisk + "개사"} sub="중위험 (실사 지표 기준)" icon={<Risk color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="Net-Zero 목표" value="2045년" sub="Green Supply 로드맵" icon={<Goal color="#03a94d" />} accent="bg-[#03a94d]/10" />
      </div>

      {/* 메인 보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 1칸: 기존 관제 요약맵 및 AI Agent 로그 터미널 */}
        <div className="lg:col-span-1">
          <Card className="p-5 flex flex-col h-[calc(100vh-290px)] min-h-[420px]">
            <CardHeader className="shrink-0 mb-2">
              <CardTitle>AI Agent 공급망 리스크 종합 실사</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between overflow-hidden h-[calc(100%-3.5rem)]">
              <p className="text-xs text-gray-500 leading-relaxed shrink-0 mb-2">
                글로벌 공급망 원자재 이력 및 협력사 정량 지표를 종합 분석하여 잠재적 규제 위반 요소를 실시간으로 추적합니다.
              </p>

              <div className="flex-1 my-1 bg-slate-50 border border-gray-100 rounded-xl p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-gray-700 min-h-0">
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
                className="w-full py-2.5 bg-[#03a94d] hover:bg-[#02823b] disabled:bg-gray-200 text-white font-bold text-s rounded-lg transition shadow-sm select-none shrink-0 mt-2"
              >
                {aiLoading ? "실사 분석 가동 중" : "AI 분석 시작"}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 2칸: 원래 공유해주신 고유 레이아웃 비율(lg:col-span-2) 및 원본 스타일 100% 보존 */}
        <div className="lg:col-span-2">
          <Card className="p-5 flex flex-col h-[calc(100vh-290px)] min-h-[420px]">
            <CardHeader className="shrink-0 mb-2">
              <CardTitle>AI Agent 리스크 실시간 알림 피드</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 h-[calc(100%-3.5rem)]">
              {alerts.map((alert) => {
                const isHigh = alert.type === "고위험";
                const isMid = alert.type === "중위험";

                const borderCls = isHigh
                  ? "border-red-500 bg-red-50/40"
                  : isMid
                    ? "border-amber-400 bg-amber-50/40"
                    : "border-[#03a94d]/40 bg-[#03a94d]/5";

                const renderIcon = () => {
                  if (isHigh) return <AlertCircle color="#ef4444" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                  if (isMid) return <AlertCircle color="#f59e0b" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                  return <AlertCircle color="#03a94d" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                };

                return (
                  <div key={alert.id} className={"flex items-start gap-3 p-3 rounded-lg border-l-4 transition hover:bg-white border " + borderCls}>
                    {renderIcon()}
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
