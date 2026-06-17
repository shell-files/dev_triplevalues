import React, { useState, useEffect } from "react";
import SidebarNav from "@components/Layout/SidebarNav";
import HeaderNav from "@components/Layout/HeaderNav";
import Login from "@homes/logins/Login";  // ---- 로그인/로그아웃 복구
import MainDashboard from "@homes/admin/MainDashboard";
import PartnerList from "@homes/admin/partners/PartnerList";
import PartnerDetail from "@homes/admin/partners/PartnerDetail";
import SupplyChainMap from "@homes/admin/maps/SupplyChainMap";
import PoList from "@homes/admin/pos/PoList";
import RiskList from "@homes/admin/risks/RiskList";
import CompanyInfo from "@partners/companys/CompanyInfo";
import { COMPANIES } from "@assets/data/masterData";
import { NOTIFICATIONS } from "@assets/data/masterData";
import "@styles/App.css";
import { GET, POST } from "@utils/Network"; // ---- 로그인/로그아웃 복구

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // ---- 로그인 상태 (1)
  const [loginData, setLoginData] = useState(null); // -------- 로그인 상태 (2)
  const [page, setPage] = useState("dashboard");
  const [pageKey, setPageKey] = useState(0);  // -------------- 로그인/로그아웃 복구
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("현대모비스");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [apiCompanies, setApiCompanies] = useState(COMPANIES); // 전사 마스터 기업 자산 파이프라인
  const [selPartner, setSelPartner] = useState(null); // 1Depth-2Depth 화면 스위칭 상태 제어 엔진

  /* 로그인 성공 핸들러 */
  const handleLoginSuccess = (data) => {
    setLoginData(data);
    const isOem = Number(data?.tier) === 0;
    setUserRole(isOem ? "현대모비스" : (data?.tier_label || "1차 협력사"));
    setPage(isOem ? "dashboard" : "company_info");
    try {
      localStorage.setItem("esg_login", JSON.stringify({
        ...data,
        userRole: isOem ? "현대모비스" : (data?.tier_label || ""),
        page: isOem ? "dashboard" : "company_info",
      }));
    } catch (e) {}
    setIsLoggedIn(true);
  };
    
  /* 로그아웃 핸들러 */
  const handleLogout = () => {
    POST("/auth/logout", { method: "POST" })
     .then(json => {
        setIsLoggedIn(false);
        localStorage.removeItem("esg_login");
        setLoginData(null);
        setPage("dashboard");
        setUserRole("현대모비스");
      });
  };
  
  /* 앱 마운트 시 세션 복원 */
  useEffect(() => {
    if (isLoggedIn) return;
    try {
      const saved = localStorage.getItem("esg_login");
      if (saved) {
        const data = JSON.parse(saved);
        setLoginData(data);
        setUserRole(data.userRole || "현대모비스");
        setPage(data.page || "dashboard");
        setIsLoggedIn(true);
      }
    } catch (e) {}
  }, []);
  
  /* 로그인 후 협력사 목록 API 조회 */
  useEffect(() => {
    if (!isLoggedIn) return;
    POST("/company/list", { userRole })
      .then(json => {
        if (json.status && json.data?.companies) setApiCompanies(json.data.companies);
        else setApiCompanies([]);
      });
  }, [userRole, isLoggedIn]);
  
  /* 로그인 전 가드 */
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const unread = notifications.filter((n) => !n.read).length;
  
  const handleResetPage = () => {
    setPage("dashboard");
    setSelPartner(null);
  };

  const handleMenuChange = (targetPage) => {
    setPage(targetPage);
    setPageKey(prev => prev + 1); // 복구된 화면 강제 리마운트 파이프라인
    setSelPartner(null); // 메뉴 이동 시 상세 보기 바인딩 초기화 리셋 안전장치 가동
  };

  /* 기존 레거시 구조에 로그인 세션 및 렌더링 키 결합 통합 완공 */
  const renderContent = () => {
    if (page === "dashboard") {
      return <MainDashboard key={pageKey} />;
    }
    
    if (page === "partner") {
      if (selPartner) {
        return (
          <PartnerDetail
            key={pageKey}
            partner={selPartner}
            partnerRegistration="시스템 자동화 트랙"
            onBack={() => setSelPartner(null)}
            loginData={loginData}
          />
        );
      }
      return (
        <PartnerList
          key={pageKey}
          userRole={userRole}
          partnerRegistration="시스템 자동화 트랙"
          setSelPartner={setSelPartner}
          apiCompanies={apiCompanies}
          loginData={loginData}
        />
      );
    }
    
    const pages = {
      company_info: <CompanyInfo key={pageKey} />,
      supplychainMap: <SupplyChainMap key={pageKey} />,
      po: <PoList key={pageKey} />,
      risk: <RiskList key={pageKey} />
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
        // navigateTo={navigateTo}
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
          handleLogout={handleLogout}
          loginData={loginData}
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