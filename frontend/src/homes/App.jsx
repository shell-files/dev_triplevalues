// src/homes/App.jsx
// ────────────────────────────────────────────────────────
// [v2.0] 2026-06-09 — 로그인 게이트, API 연동, 더미 제거, 권한별 메뉴, pageKey
// ────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import SidebarNav from "@components/Layout/SidebarNav";
import HeaderNav from "@components/Layout/HeaderNav";
import MainDashboard from "@homes/admin/MainDashboard";
import PartnerList from "@homes/admin/partners/PartnerList";
import PartnerDetail from "@homes/admin/partners/PartnerDetail";
import SupplyChainMap from "@homes/admin/maps/SupplyChainMap";
import Login from "@homes/logins/Login";
import { NOTIFICATIONS } from "@assets/data/masterData";
import "@styles/App.css";
import { GET, POST } from "@utils/Network";

const PlaceholderPage = ({ title, desc }) => (
  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{desc}</p>
  </div>
);

const App = () => {
  /* 로그인 상태 */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState(null);

  const [page, setPage] = useState("dashboard");
  const [pageKey, setPageKey] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("현대모비스");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [apiCompanies, setApiCompanies] = useState([]);
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
    POST("/api/auth/logout", { method: "POST" })
     .then(json => {
        setIsLoggedIn(false);
        localStorage.removeItem("esg_login");
        setLoginData(null);
        setPage("dashboard");
        setUserRole("현대모비스");
    });
  };
  
    /* 사이드 메뉴 클릭 → 강제 리마운트 */
    const navigateTo = (targetPage) => {
      setPage(targetPage);
      setPageKey(prev => prev + 1);
      setSelPartner(null);
      setMobileMenuOpen(false);
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
      POST("/api/company/list", { userRole })
        .then(json => {
          if (json.status && json.data?.companies) setApiCompanies(json.data.companies);
          else setApiCompanies([]);
        });
    }, [userRole, isLoggedIn]);
  
    /* 로그인 전 */
    if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }
  
    const unread = notifications.filter(n => !n.read).length;
  
    const renderContent = () => {
      if (page === "dashboard") return <MainDashboard key={pageKey} />;
  
      if (page === "partner") {
        if (selPartner) {
          return <PartnerDetail key={pageKey} partner={selPartner} onBack={() => setSelPartner(null)} loginData={loginData} />;
        }
        return <PartnerList key={pageKey} userRole={userRole} setSelPartner={setSelPartner}
          apiCompanies={apiCompanies} loginData={loginData} />;
      }
  
      const pages = {
        supplychainMap: <SupplyChainMap key={pageKey} />,
        company_info: <PlaceholderPage title="기업 정보 관리" desc="기업 정보 등록/수정/상세 화면" />,
        partner_list: <PlaceholderPage title="협력사 정보" desc="하위 협력사 정보 조회" />,
        partner_rawmat: <PlaceholderPage title="원자재 관리" desc="원자재 관리 화면" />,
        po: <PlaceholderPage title="구매 발주 관리" desc="Phase 4 스프린트에서 트랜잭션 진행 현황 및 SChip 상태 결합이 진행될 영역입니다." />,
        risk: <PlaceholderPage title="리스크 현황" desc="Phase 4 스프린트에서 리스크 분석 및 ESG 평가 현황이 진행될 영역입니다." />,
      };
      return pages[page] || <PlaceholderPage title="준비 중인 화면" desc="선택한 메뉴의 화면 마이그레이션 스프린트 가동을 대기 중입니다." />;
    };
  
    return (
      <div className="flex h-screen bg-slate-50 font-sans">
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
        <SidebarNav page={page} setPage={setPage} userRole={userRole}
          mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
          navigateTo={navigateTo} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderNav userRole={userRole} showNotif={showNotif} setShowNotif={setShowNotif}
            notifications={notifications} setNotifications={setNotifications}
            unread={unread} setMobileMenuOpen={setMobileMenuOpen}
            handleLogout={handleLogout} loginData={loginData} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pt-16">
            {renderContent()}
          </main>
        </div>
      </div>
    );
  };
  
  export default App;