// ────────────────────────────────────────────────────────
// [v2.3] 2026-06-16 - sessionStorage 완전 제거, BE 세션 관리 (GET /auth/me) - 초대 URL 자동 로그인 (invite/{partnerId} 감지)
// [v2.2] 2026-06-15 - 초대 URL 자동 로그인 (invite/{partnerId} 감지)
// [v2.1] 2026-06-12 — 새로고침 시 현재 페이지 유지 (sessionStorage.page 동기화)
// [v2.0] 2026-06-09 — 로그인 게이트, API 연동, 더미 제거, 권한별 메뉴, pageKey
// ────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import SidebarNav from "@components/Layout/SidebarNav";
import HeaderNav from "@components/Layout/HeaderNav";
import Login from "@homes/logins/Login";  // ---- 로그인/로그아웃 복구
import MainDashboard from "@homes/admin/MainDashboard";
import PartnerList from "@homes/admin/partners/PartnerList";
import PartnerDetail from "@homes/admin/partners/PartnerDetail";
import SupplyChainMap from "@homes/admin/maps/SupplyChainMap";
import PoList from "@homes/admin/pos/PoList";
import RiskList from "@homes/admin/risks/RiskList";
import { COMPANIES } from "@assets/data/masterData";
import { NOTIFICATIONS } from "@assets/data/masterData";
import "@styles/App.css";
import { GET, POST, PUT } from "@utils/Network"; // ---- 로그인/로그아웃 복구

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

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [count, setCount] = useState(0);
  const ws = useRef(null); // WebSocket 객체

  /* 웹소켓 연결 핸들러 */
  const handleConnectChat = (id) => {
    if (ws.current) ws.current.close();
    let pId = null;
    if (id !== undefined) pId = id;
    if (pId === null || pId === undefined) return;

    let baseURL = import.meta.env.VITE_API_URL_DOMAIN || "localhost:8000";
    ws.current = new WebSocket(`ws://tval.${baseURL}/ws/${pId}`);
    ws.current.onopen = () => setIsConnected(true);

    ws.current.onmessage = (event) => {
      // 💡 서버에서 온 JSON 문자열을 자바스크립트 객체로 변환
      const resData = JSON.parse(event.data);
      console.log(resData);
      // if (resData.sender != clientId) {
      //   if (resData.type === 'tv') {
      //     console.log(resData);
      //     setMessages((prev) => [...prev, resData]);
      //     setCount(c => c + 1);
      //   }
      // }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  };

  /* 로그인 성공 핸들러 */
  const handleLoginSuccess = (data) => {
    setLoginData(data);
    const isOem = Number(data?.tier) === 0;
    setUserRole(isOem ? "현대모비스" : (data?.tier_label || "1차 협력사"));
    setPage(isOem ? "dashboard" : "company_info");
    // handleConnectChat(data?.partner_id || undefined);
    /* [v2.4] tokenUuid를 document.cookie에 저장 (랜덤 UUID만, 민감 데이터 아님) */
    // if (data?.tokenUuid) {
    //   document.cookie = `esg_token=${data.tokenUuid}; path=/; SameSite=Lax`;
    // }
    
    setIsLoggedIn(true);
  };
    
  /* 로그아웃 핸들러 */
  const handleLogout = () => {
    POST("/auth/logout", { method: "POST" })
     .then(json => {
        setIsLoggedIn(false);
        /* [v2.4] 쿠키 삭제 */
        document.cookie = "esg_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setLoginData(null);
        setPage("dashboard");
        setUserRole("현대모비스");
      });
  };
  
  /* [v2.3] 앱 마운트 시 - 초대 URL 감지 + BE 세션 조회 (sessionStorage 미사용) */
  useEffect(() => {
    if (isLoggedIn) return;

    /* 초대 URL 감지: /invite/{partnerId} */
    const urlPath = window.location.pathname;
    const inviteMatch = urlPath.match(/\/invite\/([A-Za-z0-9\-]+)/);
    if (inviteMatch) {
      const partnerId = inviteMatch[1];
      POST(`/auth/invite-login/${partnerId}`)
        .then(res => {
          if (res.status && res.data?.accessType === "free_pass") {
            handleLoginSuccess(res.data);
            window.history.replaceState({}, "", "/");
          } else if (res.data?.accessType === "require_auth") {
            alert(res.message || "등록이 완료된 기업입니다. 2차 인증 후 로그인해 주세요.");
            window.history.replaceState({}, "", "/");
          } else {
            alert(res.message || "유효하지 않은 초대 링크입니다.");
            window.history.replaceState({}, "", "/");
          }
        });
      return;
    }

    /* [v2.3] BE 세션 조회 — httpOnly 쿠키 기반 (sessionStorage 미사용) */
    GET("/auth/me").then(res => {
      if (res.status && res.data?.isLoggedIn) {
        setLoginData(res.data);
        const isOem = Number(res.data?.tier) === 0;
        setUserRole(isOem ? "현대모비스" : (res.data?.tier_label || "1차 협력사"));
        setPage(res.data?.page || (isOem ? "dashboard" : "company_info"));
        // handleConnectChat(res.data?.partner_id || undefined);
        setIsLoggedIn(true);
      }
    });
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
  console.log(isLoggedIn)
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
    /* [v2.3] BE에 현재 페이지 저장 (새로고침 복원용) */
    PUT("/auth/page", { page: targetPage });
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