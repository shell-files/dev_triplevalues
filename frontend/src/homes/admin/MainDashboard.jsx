import React, { useState, useEffect } from "react";
import { COMPANIES } from "@assets/data/masterData";
import Kpi from "@components/Common/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

import { GET, POST } from "@utils/Network";

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
  const [selectedAlertId, setSelectedAlertId] = useState(null);


  // 실시간 알림 피드 상태 관리
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [companyStats, setCompanyStats] = useState({
    tier1Count: 0,
    tier2Count: 0,
    tier3Count: 0,
    totalExceptZero: 0
  });

  const [verificationStats, setVerificationStats] = useState({
    totalCertCount: 0
  });

  // KPI 마스터 데이터 집계
  const certCount = COMPANIES.reduce((a, c) => a + (c.cert_count || 0), 0);
  const midRisk = COMPANIES.filter((c) => c.risk === "중위험").length;

  // 공급망 기업 통계 API 호출 함수
  const fetchCompanyStats = async () => {
    try {
      const currentTokenUuid = document.cookie
        .split('; ')
        .find(c => c.startsWith('esg_token='))
        ?.split('=')[1] || "";

      // 백엔드 getCompanytotalCountProcess 모델과 연동
      const res = await GET("/dashboard/companies/count");

      // 백엔드 responseModel 규격(True, "메시지", data)에 맞춘 바인딩
      if (res && res.status && res.data) {
        setCompanyStats(res.data);
      }
    } catch (error) {
      console.error("공급망 티어 통계 조회 실패:", error);
    }
  };

  // 공급망 기업 인증 완료 회사 수 API 호출 함수
  const fetchVerificationStats = async () => {
    try {
      const currentTokenUuid = document.cookie
        .split('; ')
        .find(c => c.startsWith('esg_token='))
        ?.split('=')[1] || "";

      // 백엔드 getCompanyVerificationCompleteCountProcess 모델과 연동
      const res = await GET("/dashboard/companies/verification");

      // 백엔드 responseModel 규격(True, "메시지", data)에 맞춘 바인딩
      if (res && res.status && res.data) {
        setVerificationStats(res.data);
      }
    } catch (error) {
      console.error("공급망 기업 인증 완료 회사 수 조회 실패:", error);
    }
  };

  // 1. 실시간 알림 피드 API 호출 (컴포넌트 마운트 시 가동)
  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      // 1. 브라우저의 document.cookie에서 esg_token(uuid 역할) 값을 읽어옵니다.
      const currentTokenUuid = document.cookie
        .split('; ')
        .find(c => c.startsWith('esg_token='))
        ?.split('=')[1] || "";

      // 2. 백엔드 dashboardAlertsRiskModel 규격에 맞춰 uuid 파라미터를 객체로 전달합니다.
      // Network.js의 GET 함수 구조가 GET(url, params) 형태이므로 두 번째 인자로 넘겨줍니다.
      const res = await GET("/dashboard/alerts", {
        uuid: currentTokenUuid
      });

      if (res && res.status && Array.isArray(res.data)) {
        setAlerts(res.data);
      } else {
        console.error("알림 피드 데이터 포맷이 올바르지 않습니다.", res);
      }
    } catch (error) {
      console.error("알림 피드 조회 실패:", error);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchCompanyStats();
    fetchVerificationStats();
  }, []);

  // 2. 피드 아이템 클릭 시 실행: 모달 대신 좌측 AI 관제 콘솔 화면에 상세 내용 주입
  const handleAlertClick = async (alertId) => {
    setAiLoading(true);
    setAiResult(null);
    setSelectedAlertId(alertId); // 클릭시 아이디 저장

    try {
      const res = await GET(`/dashboard/alerts/${alertId}`);
      if (res && res.status && res.data) {
        const detail = res.data;

        // 좌측 콘솔창 텍스트 구조 빌드 및 바인딩
        const formattedReport =
          `[AI Agent 실시간 정밀 실사 판독 보고서]

■ 대상 기업: ${detail.company || "미등록 협력사"}
■ 감지 지표: ${detail.ruleName || "-"}
■ 필수 조치: ${detail.actionRequired || "즉시 조치 필요 사항 없음"}

--------------------------------------------------
[1] AI 추론 근거 (Reasoning)
--------------------------------------------------
${detail.aiReasoning || "분석된 추론 근거 데이터가 준비 중입니다."}

--------------------------------------------------
[2] AI 추천 가이드 로드맵 (Recommendation)
--------------------------------------------------
${detail.aiRecommendation || " 조치 사항이 준비 중입니다."}`;

        setAiResult(formattedReport);
      } else {
        setAiResult("⚠️ 상세 데이터를 불러오지 못했습니다. 백엔드 상태를 확인해 주세요.");
      }
    } catch (error) {
      console.error("상세 정보 조회 오류:", error);
      setAiResult("❌ 상세 데이터 연동 중 통신 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  // 3. [신규 추가] 알림 조치 완료 (숨기기) 로직
  const handleDeleteAlert = async () => {
    if (!selectedAlertId) {
      alert("조치할 알림 피드를 먼저 우측에서 선택해 주세요.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await POST(`/dashboard/alerts/${selectedAlertId}/resolve`);
      console.log("백엔드가 돌려준 실제 데이터 모양:", res);

      // 1. 응답 데이터를 통째로 글자로 변환하여 백엔드 검증 문구가 있는지 확인 (치트키 💡)
      const resStr = JSON.stringify(res || {});
      const targetErrorKeyword = "생성되지 않은 알림은 조치 완료 처리할 수 없습니다.";

      if (resStr.includes(targetErrorKeyword)) {
        // 문자열 안에서 정확히 해당 에러 메시지만 추출하거나, 매칭되면 통째로 지정 문구 출력
        alert("⚠️ 처리 실패: AI 추론 근거 및 추천 로드맵이 생성되지 않은 알림은 조치 완료 처리할 수 없습니다.");
      }
      // 🟢 2순위 체크: 백엔드가 정상 성공 응답을 내려준 경우
      else if (res && (res.status === true || res.message === "조치 완료 처리되었습니다.")) {
        alert("성공적으로 조치되어 대시보드에서 제외되었습니다.");
        setAiResult(null);
        setSelectedAlertId(null); // ID 초기화
        fetchAlerts(); // 우측 피드 실시간 갱신
      }
      // 🟡 3순위 체크: 그 외 예외 구조 방어 코드
      else {
        alert("⚠️ 처리 실패: 서버 응답 규격이 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("알림 처리 중 오류 발생:", error);
      alert("❌ 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full">
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">대시보드</h2>
        <p className="text-sm text-gray-400 mt-0.5">현대모비스 Scope 3 공급망 및 글로벌 ESG 규제(CSRD, CSDDD, Net-Zero 2045) 대응 통합 관제 시스템입니다.</p>
      </div>

      {/* KPI 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Kpi label="공급망 등록 기업"
          value={(companyStats.totalExceptZero || 0) + "개사"}
          sub={`1차 ${companyStats?.tier1Count || 0}, 2차 ${companyStats?.tier2Count || 0}, 3차 ${companyStats?.tier3Count || 0}`}
          icon={<Company color="#03a94d" />}
          accent="bg-[#03a94d]/10"
        />
        <Kpi
          label="인증 완료 기업"
          value={(verificationStats.totalCertCount || 0) + "개"}
          sub="공급망 전체 보유 인증 합계"
          icon={<Auth color="#03a94d" />}
          accent="bg-[#03a94d]/10"
        />
        <Kpi label="리스크 관리" value={midRisk + "개사"} sub="중위험 (실사 지표 기준)" icon={<Risk color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="Net-Zero 목표" value="2045년" sub="Green Supply 로드맵" icon={<Goal color="#03a94d" />} accent="bg-[#03a94d]/10" />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 좌측: AI Agent 공급망 리스크 종합 실사 (텍스트 리포트 출력 구역) */}
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
                onClick={handleDeleteAlert}
                // 선택된 알림이 없거나 로딩 중일 때는 버튼 비활성화
                disabled={aiLoading || !selectedAlertId}
                className="w-full py-2.5 bg-[#03a94d] hover:bg-[#02823b] disabled:bg-gray-200 text-white font-bold text-s rounded-lg transition shadow-sm select-none shrink-0 mt-2"
              >
                {aiLoading ? "처리 중..." : "확인 및 조치 완료 (숨기기)"}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* 우측: AI Agent 리스크 실시간 알림 피드 */}
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

                // 위험 등급 스케일에 완벽히 부합하도록 선언형 컴포넌트 분기 및 16진수 색상 코드 직접 매핑 주입
                const renderIcon = () => {
                  if (isHigh) return <AlertCircle color="#ef4444" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                  if (isMid) return <AlertCircle color="#f59e0b" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                  return <AlertCircle color="#03a94d" className="w-5 h-5 shrink-0 mt-0.5 select-none" />;
                };

                return (
                  <div
                    key={alert.id}
                    // 1. 클릭 시 해당 alert.id를 가지고 handleAlertClick 함수를 실행하도록 바인딩
                    onClick={() => handleAlertClick(alert.id)}
                    // 2. 마우스를 올렸을 때 클릭 가능한 손가락 모양(cursor-pointer)이 나오도록 클래스 추가
                    className={"flex items-start gap-3 p-3 rounded-lg border-l-4 transition hover:bg-white border cursor-pointer " + borderCls}
                  >
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
