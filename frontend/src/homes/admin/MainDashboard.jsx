import React, { useState, useEffect } from "react";
import Kpi from "@components/Common/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";
import { GET, POST } from "@utils/Network";

/* [v2.1] BE responseModel(False) 응답 처리 통일, try/catch 전면 적용 */
// 신설 폴더 경로인 @components/Common/Icons/ 에서 7종의 컴포넌트형 아이콘 임포트
import Company from "@components/Common/Icons/Company";
import Auth from "@components/Common/Icons/Auth";
import Risk from "@components/Common/Icons/Risk";
import Goal from "@components/Common/Icons/Goal";
import AlertCircle from "@components/Common/Icons/AlertCircle";

const MainDashboard = () => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // 실시간 알림 피드 상태 관리
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState({ tier1Count: 0, tier2Count: 0, tier3Count: 0, totalExceptZero: 0 });
  const [verificationStats, setVerificationStats] = useState({ totalCertCount: 0 });
  const [midRiskStats, setMidRiskStats] = useState({ midRiskCount: 0 });

  const formatDate = (dateVal) => {
    if (!dateVal) return "-";
    const str = String(dateVal);
    return str.length >= 10 ? str.substring(0, 10) : str;
  };

  /* ── API 호출 (try/catch + res.status 검증 통일) ── */
  // 1. 실시간 알림 피드 API 호출 (컴포넌트 마운트 시 가동)
  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      // 2. 백엔드 dashboardAlertsRiskModel 규격에 맞춰 uuid 파라미터를 객체로 전달합니다.
      // Network.js의 GET 함수 구조가 GET(url, params) 형태이므로 두 번째 인자로 넘겨줍니다.
      const res = await GET("/dashboard/alerts");
      if (res && res.status === true && Array.isArray(res.data)) {
        setAlerts(res.data);
      } else {
        console.error("알림 피드 조회 실패:", res?.message || "응답 형식 오류");
        setAlerts([]);
      }
    } catch (error) {
      console.error("알림 피드 통신 오류:", error);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  // 공급망 기업 통계 API 호출 함수
  const fetchCompanyStats = async () => {
    try {

      // 백엔드 getCompanytotalCountProcess 모델과 연동
      const res = await GET("/dashboard/companies/count");

      // 백엔드 responseModel 규격(True, "메시지", data)에 맞춘 바인딩
      if (res && res.status === true && res.data) {
        setCompanyStats(res.data);
      }
    } catch (error) {
      console.error("공급망 티어 통계 조회 실패:", error);
    }
  };

  // 공급망 기업 인증 완료 회사 수 API 호출 함수
  const fetchVerificationStats = async () => {
    try {
      // 백엔드 getCompanyVerificationCompleteCountProcess 모델과 연동
      const res = await GET("/dashboard/companies/verification");

      // 백엔드 responseModel 규격(True, "메시지", data)에 맞춘 바인딩
      if (res && res.status === true && res.data) {
        setVerificationStats(res.data);
      }
    } catch (error) {
      console.error("인증 완료 회사 수 조회 실패:", error);
    }
  };

  const fetchMidRiskStats = async () => {
    try {
      const res = await GET("/dashboard/companies/midrisk");
      if (res && res.status === true && res.data) {
        setMidRiskStats(res.data);
      }
    } catch (error) {
      console.error("중위험 기업 수 조회 실패:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchCompanyStats();
    fetchVerificationStats();
    fetchMidRiskStats();
  }, []);

  /* ── 알림 클릭 → AI 콘솔 상세 ── */
  // 2. 피드 아이템 클릭 시 실행: 모달 대신 좌측 AI 관제 콘솔 화면에 상세 내용 주입
  const handleAlertClick = async (alertId) => {
    setAiLoading(true);
    setAiResult(null);
    setSelectedAlertId(alertId); // 클릭시 아이디 저장

    try {
      const res = await GET(`/dashboard/alerts/${alertId}`);
      if (res && res.status === true && res.data) {
        const d = res.data;
        
        // 좌측 콘솔창 텍스트 구조 빌드 및 바인딩
        setAiResult(
`[AI Agent 실시간 정밀 실사 판독 보고서]

■ 대상 기업: ${d.company || "미등록 협력사"}
■ 감지 지표: ${d.ruleName || "-"}
■ 필수 조치: ${d.actionRequired || "즉시 조치 필요 사항 없음"}

--------------------------------------------------
[1] AI 추론 근거 (Reasoning)
--------------------------------------------------
${d.aiReasoning || "분석된 추론 근거 데이터가 준비 중입니다."}

--------------------------------------------------
[2] AI 추천 가이드 로드맵 (Recommendation)
--------------------------------------------------
${d.aiRecommendation || "조치 사항이 준비 중입니다."}`
        );
      } else {
        setAiResult(`⚠️ 상세 데이터를 불러오지 못했습니다.\n사유: ${res?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("상세 정보 조회 오류:", error);
      setAiResult("❌ 상세 데이터 연동 중 통신 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── 알림 조치 완료 ── */
  // 3. [신규 추가] 알림 조치 완료 (숨기기) 로직
  const handleDeleteAlert = async () => {
    if (!selectedAlertId) {
      alert("조치할 알림 피드를 먼저 우측에서 선택해 주세요.");
      return;
    }
    setAiLoading(true);

    try {
      const res = await POST(`/dashboard/alerts/${selectedAlertId}/resolve`);
      // 🟢 2순위 체크: 백엔드가 정상 성공 응답을 내려준 경우
      if (res && res.status === true) {
        alert("성공적으로 조치되어 대시보드에서 제외되었습니다.");
        setAiResult(null);
        setSelectedAlertId(null);
        fetchAlerts();
      } else {
        // 🟡 3순위 체크: 그 외 예외 구조 방어 코드
        alert(`⚠️ 처리 실패: ${res?.message || "서버 응답 규격이 올바르지 않습니다."}`);
      }
    } catch (error) {
      console.error("알림 처리 중 오류 발생:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
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

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Kpi label="공급망 등록 기업"
          value={(companyStats.totalExceptZero || 0) + "개사"}
          sub={`1차 ${companyStats.tier1Count || 0}, 2차 ${companyStats.tier2Count || 0}, 3차 ${companyStats.tier3Count || 0}`}
          icon={<Company color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="인증 완료 기업"
          value={(verificationStats.totalCertCount || 0) + "개"}
          sub="공급망 전체 보유 인증 합계"
          icon={<Auth color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="리스크 관리"
          value={(midRiskStats.midRiskCount || 0) + "개사"}
          sub="중위험 (실사 지표 기준)"
          icon={<Risk color="#03a94d" />} accent="bg-[#03a94d]/10" />
        <Kpi label="Net-Zero 목표" value="2045년" sub="Green Supply 로드맵"
          icon={<Goal color="#03a94d" />} accent="bg-[#03a94d]/10" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: AI 콘솔 */}
        <div className="lg:col-span-1">
          <Card className="p-5 flex flex-col h-[calc(100vh-290px)] min-h-[420px]">
            <CardHeader className="shrink-0 mb-2"><CardTitle>AI Agent 공급망 리스크 종합 실사</CardTitle></CardHeader>
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
                ) : aiResult ? aiResult : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-center select-none py-10">
                    분석 시작 버튼을 누르면<br />AI 종합 관제 콘솔이 가동됩니다.
                  </div>
                )}
              </div>
              <button onClick={handleDeleteAlert} disabled={aiLoading || !selectedAlertId}
                className="w-full py-2.5 bg-[#03a94d] hover:bg-[#02823b] disabled:bg-gray-200 text-white font-bold text-s rounded-lg transition shadow-sm select-none shrink-0 mt-2">
                {aiLoading ? "처리 중..." : "확인 및 조치 완료"}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 알림 피드 */}
        <div className="lg:col-span-2">
          <Card className="p-5 flex flex-col h-[calc(100vh-290px)] min-h-[420px]">
            <CardHeader className="shrink-0 mb-2"><CardTitle>AI Agent 리스크 실시간 알림 피드 [<span style={{color: '#ef4444'}}>{alerts.length}</span>건]</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 h-[calc(100%-3.5rem)]">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400 text-sm">알림 데이터를 불러오는 중입니다...</div>
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400 text-sm">표시할 알림이 없습니다.</div>
              ) : alerts.map((a) => {
                const isHigh = a.type === "고위험";
                const isMid = a.type === "중위험";
                const borderCls = isHigh ? "border-red-500 bg-red-50/40" : isMid ? "border-amber-400 bg-amber-50/40" : "border-[#03a94d]/40 bg-[#03a94d]/5";
                const iconColor = isHigh ? "#ef4444" : isMid ? "#f59e0b" : "#03a94d";

                return (
                  <div key={a.id} onClick={() => handleAlertClick(a.id)}
                    className={"flex items-start gap-3 p-3 rounded-lg border-l-4 transition hover:bg-white border cursor-pointer " + borderCls}>
                    <AlertCircle color={iconColor} className="w-5 h-5 shrink-0 mt-0.5 select-none" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">{a.company || "-"}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500 font-semibold">{a.tier || "-"}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(a.date)}</span>
                        <span className="ml-auto"><RChip v={a.type} /></span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{a.msg || "-"}</p>
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
