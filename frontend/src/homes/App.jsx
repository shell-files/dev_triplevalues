import { useState, useEffect } from "react";
/* 중앙 통제형 스타일 경로 동기화 및 별칭 바인딩 */
import '@styles/App.css';
import SidebarNav from "@components/Layout/SidebarNav";

// [4단계 기준] 아직 이관 배치되지 않은 하부 페이지 자산들은 import 체인을 차단하고,
// npm run dev 실행 시 무결한 구동을 입증할 수 있도록 인라인 가상 화면 플레이스홀더 구조로 수렴시킵니다.
const PlaceholderPage = ({ title, desc }) => (
  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{desc}</p>
    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 font-mono select-none">
      NEXT MILESTONE: 해당 도메인 이슈 스프린트 구동 시 실제 컴포넌트 자산 신설 및 이관 연결 예정 구역
    </div>
  </div>
);

const App = () => {
  const [page, setPage] = useState("dashboard");
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("현대모비스"); // 디폴트: 원청사 마스터
  const [partnerRegistration, setPartnerRegistration] = useState({});
  const [selPartner, setSelPartner] = useState(null);
  const [selBom, setSelBom] = useState(null);
  const [isRequestingRM, setIsRequestingRM] = useState(false);
  const [urgentRM, setUrgentRM] = useState(null);

  // 백엔드 의존성을 전면 차단하고 가상 프런트엔드 데이터 싱크 체인 수립
  const [notifications, setNotifications] = useState([
    { id: 1, title: "자가진단 서류 업데이트", msg: "노벨리스코리아의 자가진단 서류가 업데이트되었습니다.", type: "SELF", time: "10분 전", read: false, level: "info" },
    { id: 2, title: "원자재 보완 요청 반려", msg: "원자재 보완 요청 건에 대한 반려 알림이 수신되었습니다.", type: "URGENT", time: "1시간 전", read: false, level: "warn" }
  ]);
  const [apiCompanies, setApiCompanies] = useState([]);

  // DB 연동 레이어를 가상 마스터 데이터 체인으로 방어 및 동기화
  useEffect(() => {
    // 백엔드 API fetch 호출은 모든 UI 마이그레이션 이슈 종료 후 전환 예정이므로 더미 동기화로 방어
    const dummyCompanies = [
      { id: "C001", name: "노벨리스코리아", tier: "1차 협력사" },
      { id: "C002", name: "케이알엠", tier: "2차 협력사" },
      { id: "C003", name: "Comilog", tier: "3차 협력사" }
    ];
    setApiCompanies(dummyCompanies.filter(c => userRole === "현대모비스" || c.tier === userRole));
  }, [userRole]);

  // userRole의 급격한 모드 스위칭 시 브라우저 뷰 분기 교차 제어 가드 수립
  useEffect(() => {
    if (userRole === "현대모비스") {
      setPage("dashboard");
    } else {
      setPage("company_info"); // 협력사 포털 모드 진입 시 자동 리다이렉트
    }
  }, [userRole]);

  const unread = notifications.filter((n) => !n.read).length;
  
  // 3차 협력사용 권한 계층 필터 제약 규칙 완비
  const displayPage = () => {
    return userRole === "3차 협력사" && page === "partner_list" ? "company_info" : page;
  };

  // 조건부 가상 돔 바인딩 체인 (npm run dev 상시 컴파일 컴플리트 규격)
  const pages = {
    dashboard: <PlaceholderPage title="원청사 메인 관제 대시보드" desc="Phase 2 스프린트에서 Recharts 탄소 배출 시각화 차트 및 종합 KPI 카드가 안착될 영역입니다." />,
    partner: selPartner === null ? (
      <PlaceholderPage title="공급망 협력사 마스터 목록" desc="Phase 2 스프린트에서 전사 1·2·3차 협력사 격자 명세 목록 데이터 테이블이 연결될 영역입니다." />
    ) : (
      <PlaceholderPage title="협력사 ESG 스코어 상세 뷰" desc="Phase 2 스프린트에서 협력사 자가진단 및 증빙 서류 정밀 실사 검증 패널이 안착될 영역입니다." />
    ),
    company_info: (
      <PlaceholderPage title="협력사 포털 - 기업 정보 관리" desc="Phase 4 피날레 스프린트에서 웰컴 스크린 및 2대 탭 교차 토글 시스템이 완공될 영역입니다." />
    ),
    po: <PlaceholderPage title="글로벌 구매 PO 마스터 관리" desc="향후 구매 관리 도메인 스프린트에서 격자 보드가 이식될 영역입니다." />,
    rawmat: urgentRM ? (
      <PlaceholderPage title="특정 항목 선택형 긴급 요청 Form" desc="Phase 3 스프린트에서 긴급 자재 보완 인터랙션이 가동될 영역입니다." />
    ) : isRequestingRM ? (
      <PlaceholderPage title="원자재 정보 요청 서식 인터페이스" desc="Phase 3 스프린트에서 다차원 정보 서식이 탑재될 영역입니다." />
    ) : (
      <PlaceholderPage title="Scope 3 핵심 원자재 자산 관리" desc="Phase 3 스프린트에서 원자재 계약 상태 관제 명세가 연동될 영역입니다." />
    ),
    risk: <PlaceholderPage title="글로벌 규제별 리스크 현황 관제탑" desc="향후 평가 도메인 스프린트에서 독립 리스크 레이아웃이 연동될 영역입니다." />,
    inspection: <PlaceholderPage title="6단계 현장 실사 계획 및 보고서 작성" desc="Phase 3 스프린트에서 실사 프로세스 흐름 칩 바 및 동적 보고서 폼이 안착될 영역입니다." />,
    bom: selBom === null ? (
      <PlaceholderPage title="제품군별 자재 명세서 (BOM) 목록 조회" desc="Phase 3 스프린트에서 알루미늄 가공 자재 계층 트리 맵 구조가 활성화될 영역입니다." />
    ) : (
      <PlaceholderPage title="BOM 상세 계층 관제" desc="Phase 3 스프린트에서 독립 공급망 맵 트리 레이아웃이 연동될 영역입니다." />
    ),
    partner_list: (
      <PlaceholderPage title="하위 N차 공급망 벤더 정보 조회" desc="Phase 4 피날레 스프린트에서 하위 벤더 권한별 계층 필터 제약 보드가 이식될 영역입니다." />
    ),
    partner_rawmat: <PlaceholderPage title="원자재 사양 보완 및 요청 관리" desc="Phase 4 피날레 스프린트에서 11대 컬럼 개편 및 정보 입력 가상 워크플로우 엔진이 최종 완공될 영역입니다." />,
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      
      <SidebarNav
        page={page}
        setPage={setPage}
        userRole={userRole}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setSelPartner={setSelPartner}
        setSelBom={setSelBom}
        setUrgentRM={setUrgentRM}
        setIsRequestingRM={setIsRequestingRM}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 p-4 text-xs text-gray-400 font-mono select-none">
          [HeaderNav 이관 예정 구역 - 6단계 진행 예정]
        </div>
        
        <main className="flex-1 overflow-y-auto p-6" onClick={() => { if (showNotif) setShowNotif(false); }}>
          {pages[displayPage()]}
        </main>
      </div>
    </div>
  );
};

export default App;
