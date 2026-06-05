import React, { useState } from "react";
import SidebarNav from "@components/Layout/SidebarNav";
import HeaderNav from "@components/Layout/HeaderNav";
import MainDashboard from "@homes/admin/MainDashboard";
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
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.read).length;

  const renderContent = () => {
    if (page === "dashboard") {
      return <MainDashboard />;
    }
    
    const pages = {
      partners: <PlaceholderPage title="협력사 정보 관리" desc="Phase 3 스프린트에서 소재지 그리드 보정 및 4대 서류 증빙자료 탭 복구가 처리될 영역입니다." />,
      boms: <PlaceholderPage title="BOM 구조 관리" desc="Phase 4 스프린트에서 자재 명세서 트리형 컴포넌트 구조 고도화가 완성될 영역입니다." />,
      pos: <PlaceholderPage title="구매 발주 관리" desc="Phase 4 스프린트에서 트랜잭션 진행 현황 및 SChip 상태 결합이 진행될 영역입니다." />,
      materials: <PlaceholderPage title="원자재 사양 관리" desc="Phase 4 피날레 스프린트에서 11대 컬럼 개편 및 정보 입력 가상 워크플로우 엔진이 최종 완공될 영역입니다." />,
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
        setPage={setPage}
        userRole="현대모비스"
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderNav
          userRole="현대모비스"
          setUserRole={() => {}}
          showNotif={showNotif}
          setShowNotif={setShowNotif}
          notifications={notifications}
          setNotifications={setNotifications}
          unread={unread}
          setMobileMenuOpen={setMobileMenuOpen}
          setPage={setPage}
        />
        
        {/* pt-16을 주입하여 fixed 헤더 영역 컴포넌트의 가림 간섭을 완벽 방어 */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pt-16">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
