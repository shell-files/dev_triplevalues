import React from "react";
import heroLogo from "@assets/logos/TVLogo.png";

const PARTNER_NAV_CATEGORIES = [
  {
    title: "■ 협력사 전용 메뉴",
    items: [
      { key: "company_info", label: "기업 정보 관리", badge: null },
      { key: "partner_list", label: "협력사 정보", badge: null },
      { key: "partner_rawmat", label: "원자재 관리", badge: null },
    ]
  }
];

const NAV_CATEGORIES = [
  {
    title: "■ 기준 및 협력사 정보",
    items: [
      { key: "dashboard", label: "메인 대시보드", badge: null },
      { key: "partner", label: "협력사 정보", badge: null },
    ]
  },
  {
    title: "■ 공급망 추적 관리",
    items: [
      { key: "supplychainMap", label: "공급망 맵", badge: null },
    ]
  },
  {
    title: "■ 구매 및 자재 관리",
    items: [
      { key: "po", label: "PO 관리", badge: null },
    ]
  },
  {
    title: "■ 실사 및 평가",
    items: [
      { key: "risk", label: "리스크 현황", badge: null },
    ]
  }
];

const SidebarNav = ({
  page,
  setPage,
  userRole,
  mobileMenuOpen,
  setMobileMenuOpen,
  navigateTo,
}) => {
  const isPartnerMode = userRole !== "현대모비스";
  const currentCategories = isPartnerMode ? PARTNER_NAV_CATEGORIES : NAV_CATEGORIES;

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#03a94d] text-emerald-100 flex flex-col shrink-0 sidebar-transition md:relative md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* 로고 상단 영역 */}
      <div className="p-4 border-b border-emerald-600/30 flex items-center justify-between">
        <div
          onClick={() => {
            if (isPartnerMode) {
              setPage("company_info"); navigateTo?.("company_info");
            } else {
              setPage("dashboard"); navigateTo?.("dashboard");
            }
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center bg-white h-16 rounded-lg shadow-sm overflow-hidden cursor-pointer select-none"
        >
          <img src={heroLogo} alt="Triple Values" className="w-full h-full object-contain scale-[1.35]" />
        </div>
      </div>

      {/* 내비게이션 범주 루프 */}
      <nav className="flex-1 p-2 space-y-6 overflow-y-auto">
        {currentCategories.map((cat, idx) => (
          <div key={idx} className="space-y-2">
            <p className="px-3 text-xs font-bold text-emerald-200 tracking-wide select-none">{cat.title}</p>
            <div className="space-y-1">
              {cat.items
                .filter(n => !(userRole === "3차 협력사" && n.key === "partner_list"))
                .map(n => {
                  const isActive = page === n.key;
                  const cls = `w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-left ${
                    isActive 
                      ? "bg-[#02823b] text-white font-bold shadow-inner" 
                      : "text-emerald-100 hover:bg-emerald-600/50 hover:text-white"
                  }`;
                  return (
                    <button 
                      key={n.key} 
                      onClick={() => { 
                        setPage(n.key); 
                        setMobileMenuOpen(false); 
                      }} 
                      className={cls}
                    >
                      <span>{n.label}</span>
                      {n.badge && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-white select-none">
                          {n.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarNav;
