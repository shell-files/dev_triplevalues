import React, { useState } from "react";

const PRODUCTS_MOCK = [
  {
    id: 'PRD-001',
    name: '열차폐판',
    detailName: 'Al 3003-H14 판재 1.5T 400×300mm',
    category: '열차폐판',
    bom: 'v3.4 (최신 2026-06-01 개정)',
    partners: '8개사 (1차 2, 2차 4, 3차 2)',
    status: 'EMERGENCY',
    statusLabel: '조사 진행중'
  },
  {
    id: 'PRD-002',
    name: '휠',
    detailName: 'Al 3003-H16 판재 3.0T 17인치(D432mm)',
    category: '휠',
    bom: 'v2.1 (최신 2026-04-12 개정)',
    partners: '12개사 (1차 3, 2차 6, 3차 3)',
    status: 'NORMAL',
    statusLabel: '일반 관제'
  },
  {
    id: 'PRD-003',
    name: '파이프',
    detailName: 'Al 3003-O 튜브 Ø12×1.5T L3000mm',
    category: '파이프',
    bom: 'v1.9 (최신 2025-11-20 개정)',
    partners: '5개사 (1차 1, 2차 3, 3차 1)',
    status: 'NORMAL',
    statusLabel: '일반 관제'
  },
  {
    id: 'PRD-004',
    name: '튜브',
    detailName: 'Al 3003-H14 튜브 Ø8×1.0T L2000mm',
    category: '튜브',
    bom: 'v4.0 (최신 2026-05-15 개정)',
    partners: '14개사 (1차 4, 2차 7, 3차 3)',
    status: 'NORMAL',
    statusLabel: '일반 관제'
  }
];

const SupplyChainMapList = ({
  onViewDetail = () => { },
  onViewMaterialRequest = () => { },
  onViewRequest = () => { }
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("열차폐판");
  const [currentStatus, setCurrentStatus] = useState("ALL");

  const applyFilters = () => {
    setAppliedSearchQuery(searchQuery.trim().toLowerCase());
  };

  const resetFilters = () => {
    setSearchQuery("");
    setAppliedSearchQuery("");
    setCurrentCategory("열차폐판");
    setCurrentStatus("ALL");
  };

  const filteredProducts = PRODUCTS_MOCK.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(appliedSearchQuery) ||
      item.detailName.toLowerCase().includes(appliedSearchQuery);
    const matchesCategory = item.category === currentCategory;
    const matchesStatus =
      currentStatus === "ALL" || item.status === currentStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* 상단 제어 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">공급망 맵 제품 리스트</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors group cursor-pointer"
            onClick={onViewMaterialRequest}
          >
            <span>원자재 요청</span>
          </button>
          <button
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors group cursor-pointer animate-pulse"
            onClick={onViewRequest}
          >
            <span>긴급요청</span>
          </button>
        </div>
      </div>

      {/* 다중 조건 검색 필터 카드 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
        {/* 상단: 검색창 및 초기화/적용 버튼 */}
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-sm font-bold text-gray-600 tracking-tight">제품 분류명 검색</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색할 제품명을 입력하세요 (예: 열차폐판, 휠, 배터리 케이스 등)"
                className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 font-semibold transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={applyFilters}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              검색 필터 적용
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 하단: 다중 태그 필터 바 */}
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          {/* 카테고리 태그 필터 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-bold text-gray-500 w-24 shrink-0">제품 카테고리</span>
            <div className="flex flex-wrap gap-2" id="category-filter-container">
              {["열차폐판", "휠", "파이프", "튜브"].map((cat) => {
                const isActive = cat === currentCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setCurrentCategory(cat)}
                    className={`filter-tag-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상태 태그 필터 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-bold text-gray-500 w-24 shrink-0">조사 상태</span>
            <div className="flex flex-wrap gap-2" id="status-filter-container">
              {[
                { key: "ALL", label: "전체" },
                { key: "NORMAL", label: "일반" },
                { key: "EMERGENCY", label: "긴급" }
              ].map((stat) => {
                const isActive = stat.key === currentStatus;
                let btnClass = "filter-status-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";

                if (isActive) {
                  if (stat.key === "EMERGENCY") {
                    btnClass = "filter-status-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-rose-50 border border-rose-300 text-rose-700 cursor-pointer";
                  } else {
                    btnClass = "filter-status-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-900 text-white cursor-pointer";
                  }
                }

                return (
                  <button
                    key={stat.key}
                    onClick={() => setCurrentStatus(stat.key)}
                    className={btnClass}
                  >
                    {stat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 마스터 제품 데이터 테이블 그리드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
          <span className="text-sm font-bold text-gray-500">
            조회된 마스터 제품 규격 : <span id="product-count" className="text-emerald-600 font-extrabold">{filteredProducts.length}개</span>
          </span>
          <span className="text-xs md:text-sm text-gray-400 font-semibold">
            * 행을 클릭하시면 상세 공급망 트리(BOM 버전별 추적) 화면으로 즉각 라우팅됩니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm text-gray-700 table-fixed min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-bold bg-slate-50/50">
                <th className="px-6 py-3.5 w-28 text-sm">제품 ID</th>
                <th className="px-6 py-3.5 w-36 text-sm">제품 분류명</th>
                <th className="px-6 py-3.5 text-sm">제품명</th>
                <th className="px-6 py-3.5 text-sm">BOM 이력 차수</th>
                <th className="px-6 py-3.5 text-sm">연계 협력사 총합</th>
                <th className="px-6 py-3.5 w-32 text-sm">상태</th>
                <th className="px-6 py-3.5 text-right w-52 text-sm">작업 관리</th>
              </tr>
            </thead>
            <tbody id="product-table-body" className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400 font-semibold text-sm">
                    조회된 제품 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const isEmergency = item.status === "EMERGENCY";
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail(item.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">
                        {item.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm md:text-base group-hover:text-emerald-600 transition-colors">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-semibold text-sm">
                        {item.detailName}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-semibold text-sm">
                        {item.bom}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-semibold text-sm">
                        {item.partners}
                      </td>
                      <td className="px-6 py-4">
                        {isEmergency ? (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded text-xs font-bold shadow-3xs animate-pulse">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            {item.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            {item.statusLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewRequest();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                          >
                            긴급요청
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewMaterialRequest();
                            }}
                            className="bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                          >
                            원자재 요청
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMapList;
