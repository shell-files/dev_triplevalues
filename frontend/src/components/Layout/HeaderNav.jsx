import React from "react";
/* 절대 경로 별칭(Alias) 인프라 스펙 반영 */

const HeaderNav = ({
  userRole,
  setUserRole,
  showNotif,
  setShowNotif,
  notifications,
  setNotifications,
  unread,
  setMobileMenuOpen,
  setPage,
  setSelPartner = () => {},
  setSelBom = () => {},
  setUrgentRM = () => {},
  setIsRequestingRM = () => {}
}) => {
  return (
    <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-3 shrink-0 relative z-30">
      <div className="flex items-center gap-3">
        {/* 모바일 토글용 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base md:text-lg font-bold text-gray-800 select-none">ESG 공급망 관리 시스템</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* 역할 전환 셀렉트 인터페이스 */}
        <div className="flex items-center gap-2">
          <select
            value={userRole}
            onChange={(e) => {
              const nextRole = e.target.value;
              setUserRole(nextRole);
              setSelPartner(null);
              setSelBom(null);
              setUrgentRM(null);
              setIsRequestingRM(false);
              
              if (nextRole !== "현대모비스") {
                setPage("company_info");
              } else {
                setPage("dashboard");
              }
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-semibold focus:ring-1 focus:ring-[#03a94d] focus:border-[#03a94d] cursor-pointer focus:outline-none"
          >
            <option value="현대모비스">원청사 (현대모비스)</option>
            <option value="1차 협력사">1차 협력사 (노벨리스코리아)</option>
            <option value="2차 협력사">2차 협력사 (케이알엠)</option>
            <option value="3차 협력사">3차 협력사 (Comilog)</option>
          </select>
        </div>

        {/* 실시간 알림 제어 토글 센터 */}
        <div className="relative">
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold select-none animate-pulse">
                {unread}
              </span>
            )}
          </button>
          
          {/* 알림 센터 드롭다운 플러그인 */}
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white p-4 rounded-xl shadow-xl border border-gray-150 text-xs text-gray-400 font-mono z-50">
              [NotificationPanel 이관 예정 구역 - 7단계 진행 시 실물 결합 예정]
            </div>
          )}
        </div>

        {/* 현재 세션 역할 마크 명세 */}
        <span className="text-xs text-gray-600 font-semibold hidden sm:inline select-none">
          {userRole === "현대모비스" ? "원청사" : userRole} 관리자
        </span>
      </div>
    </header>
  );
};

export default HeaderNav;
