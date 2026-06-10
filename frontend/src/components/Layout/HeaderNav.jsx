// src/components/Layout/HeaderNav.jsx
// ────────────────────────────────────────────────────────
// [v2.0] 2026-06-09 — 셀렉트박스 제거, 로그아웃 버튼, loginData 표시
// ────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import NotificationPanel from "@components/UI/NotificationPanel";

const HeaderNav = ({
  userRole, showNotif, setShowNotif,
  notifications, setNotifications, unread,
  setMobileMenuOpen, handleLogout, loginData,
}) => {
  const notifRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-56 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-black text-gray-800 hidden md:block">ESG 공급망 관리 시스템</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* 알림 */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className="relative text-gray-500 hover:text-gray-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>}
            </button>
            {showNotif && <NotificationPanel notifications={notifications} setNotifications={setNotifications} />}
          </div>

          {/* 회사명 + 역할 */}
          <span className="text-sm font-bold text-gray-700">
            {loginData?.company_name || userRole}
            <span className="text-xs text-gray-400 ml-1">({loginData?.tier_label || userRole})</span>
          </span>

          {/* 로그아웃 */}
          <button onClick={() => { if (confirm("로그아웃 하시겠습니까?")) handleLogout?.(); }}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderNav;
