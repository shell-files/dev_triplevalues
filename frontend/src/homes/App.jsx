import React, { useState } from "react";
import SidebarNav from "@components/Layout/SidebarNav";
import HeaderNav from "@components/Layout/HeaderNav";
import MainDashboard from "@homes/admin/MainDashboard";
import PartnerList from "@homes/admin/partners/PartnerList";
import PartnerDetail from "@homes/admin/partners/PartnerDetail";
import SupplyChainMap from "@homes/admin/maps/SupplyChainMap";
import { COMPANIES } from "@assets/data/masterData";
import { NOTIFICATIONS } from "@assets/data/masterData";
import "@styles/App.css";

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
  const [userRole, setUserRole] = useState("현대모비스");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [apiCompanies, setApiCompanies] = useState(COMPANIES); // 전사 마스터 기업 자산 파이프라인
  const [selPartner, setSelPartner] = useState(null); // 1Depth-2Depth 화면 스위칭 상태 제어 엔진

  const unread = notifications.filter((n) => !n.read).length;

  const handleResetPage = () => {
    setPage("dashboard");
    setSelPartner(null);
    // setSelSupplyChain(null); // 향후 연동될 공급망 전용 상세 상태 클리어 안전장치 인프라 보존
  };

  const handleMenuChange = (targetPage) => {
    setPage(targetPage);
    setSelPartner(null); // 메뉴 이동 시 상세 보기 바인딩 초기화 리셋 안전장치 가동
    // setSelSupplyChain(null); // 향후 연동될 공급망 전용 상세 상태 클리어 안전장치 인프라 보존
  };

  const renderContent = () => {
    if (page === "dashboard") {
      return <MainDashboard />;
    }
    
    if (page === "partner") {
      // 2Depth 상세 관제 레코드가 존재하면 PartnerDetail을 바인딩하고, 없으면 1Depth 목록인 PartnerList를 렌더링
      if (selPartner) {
        return (
          <PartnerDetail
            partner={selPartner}
            partnerRegistration="시스템 자동화 트랙"
            onBack={() => setSelPartner(null)}
          />
        );
      }
      return (
        <PartnerList
          userRole={userRole}
          partnerRegistration="시스템 자동화 트랙"
          setSelPartner={setSelPartner}
          apiCompanies={apiCompanies}
        />
      );
    }
    
    const pages = {
      // 추후 파스칼 표기법 규칙에 의거하여 만든 <SupplyChainMap /> 컴포넌트가 매핑될 예정입니다.
      supplychainMap: <SupplyChainMap />,
      po: <PlaceholderPage title="구매 발주 관리" desc="Phase 4 스프린트에서 트랜잭션 진행 현황 및 SChip 상태 결합이 진행될 영역입니다." />,
      risk: <PlaceholderPage title="리스크 현황" desc="Phase 4 스프린트에서 리스크 분석 및 ESG 평가 현황이 진행될 영역입니다." />
    };

    return pages[page] || <PlaceholderPage title="준비 중인 화면" desc="선택한 메뉴의 화면 마이그레이션 스프린트 가동을 대기 중입니다." />;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      <SidebarNav
        page={page}
        setPage={handleMenuChange}
        userRole={userRole}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderNav
          userRole={userRole}
          setUserRole={setUserRole}
          showNotif={showNotif}
          setShowNotif={setShowNotif}
          notifications={notifications}
          setNotifications={setNotifications}
          unread={unread}
          setMobileMenuOpen={setMobileMenuOpen}
          onResetPage={handleResetPage}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pt-16">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
