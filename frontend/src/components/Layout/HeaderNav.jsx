import React from "react";
import NotificationPanel from "@components/UI/NotificationPanel";

const HeaderNav = ({ 
  userRole, 
  setUserRole, 
  showNotif, 
  setShowNotif, 
  notifications, 
  setNotifications, 
  unread, 
  setMobileMenuOpen, 
  onResetPage 
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 left-0 right-0 md:pl-[280px] z-40 transition-all">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileMenuOpen(true)} 
          className="md:hidden text-gray-600 hover:text-gray-900 text-xl"
        >
          ☰
        </button>
        <h1 
          onClick={onResetPage} 
          className="text-lg font-extrabold text-gray-900 tracking-tight cursor-pointer select-none"
        >
          ESG 공급망 관리 시스템
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">권한 분기</span>
          <select 
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value)}
            className="text-xs font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer focus:ring-0 pr-6"
          >
            <option value="현대모비스">원청사 (현대모비스)</option>
            <option value="1차 협력사">1차 협력사 포털</option>
            <option value="2차 협력사">2차 협력사 포털</option>
            <option value="3차 협력사">3차 협력사 포털</option>
          </select>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowNotif(!showNotif)} 
            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <NotificationPanel 
              notifications={notifications} 
              setNotifications={setNotifications} 
              onClose={() => setShowNotif(false)} 
            />
          )}
        </div>

        <div className="flex items-center border-l border-gray-200 pl-4 h-8">
          <span className="text-xs font-bold text-gray-800 hidden sm:inline select-none">
            원청사 관리자
          </span>
        </div>
      </div>
    </header>
  );
};

export default HeaderNav;
