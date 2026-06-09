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
    statusLabel: '긴급 요청'
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
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("ALL");

  const filteredProducts = currentCategory
    ? PRODUCTS_MOCK.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.detailName.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesCategory = item.category === currentCategory;
      const matchesStatus =
        currentStatus === "ALL" || item.status === currentStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      {/* 상단 제어 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">공급망 맵 제품 리스트</h2>
          <p className="text-sm text-gray-400 mt-0.5">BOM 규격별 제품 목록을 조회하고 상세 공급망 정보 및 이력을 확인합니다.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 bg-[#03a94d] hover:bg-[#02823b] active:bg-[#026b30] text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors group cursor-pointer"
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
        {/* 상단: 검색창 (실시간 필터링 적용) */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-bold text-gray-600 tracking-tight">제품 검색</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색할 제품을 입력하세요 (예: 열차폐판, 휠, AI 3003-H14 등)"
              className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* 하단: 다중 태그 필터 바 */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-3 border-t border-gray-100">
          {/* 카테고리 태그 필터 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 shrink-0">제품 카테고리</span>
            <div className="flex flex-wrap gap-2" id="category-filter-container">
              {["열차폐판", "휠", "파이프", "튜브"].map((cat) => {
                const isActive = cat === currentCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setCurrentCategory(currentCategory === cat ? null : cat)}
                    className={`filter-tag-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${isActive
                      ? "bg-[#03a94d] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-4 w-px bg-gray-200 hidden md:block"></div>

          {/* 상태 태그 필터 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 shrink-0">상태</span>
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
                    btnClass = "filter-status-btn px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-[#03a94d] text-white cursor-pointer";
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-410px)] min-h-[350px]">
        <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-500">
            조회된 마스터 제품 규격 : <span id="product-count" className="text-emerald-600 font-extrabold">{filteredProducts.length}개</span>
          </span>
          <span className="text-xs md:text-sm text-gray-400">
            * 클릭하시면 상세 공급망 맵 화면으로 이동합니다.
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-s py-12">
            {currentCategory ? "조회된 제품 정보가 없습니다." : "상단의 제품 카테고리를 선택하시면 제품 목록이 조회됩니다."}
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full table-fixed border-collapse text-sm text-gray-700">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-bold bg-slate-50/50">
                  <th className="px-6 py-3.5 text-sm text-center">제품 ID</th>
                  <th className="px-6 py-3.5 text-sm text-center">제품 분류</th>
                  <th className="px-6 py-3.5 text-sm text-center">제품명</th>
                  <th className="px-6 py-3.5 text-sm text-center">BOM 이력 차수</th>
                  <th className="px-6 py-3.5 text-sm text-center">연계 협력사</th>
                  <th className="px-6 py-3.5 text-sm text-center">상태</th>
                  <th className="px-6 py-3.5 text-center text-sm">공급망 맵</th>
                </tr>
              </thead>
              <tbody id="product-table-body" className="divide-y divide-gray-100">
                {filteredProducts.map((item) => {
                  const isEmergency = item.status === "EMERGENCY";
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail(item.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-gray-500 text-sm truncate text-center">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 truncate text-center">
                        <div className="text-gray-900 text-sm group-hover:text-emerald-600 transition-colors truncate text-center">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm truncate text-center">
                        {item.detailName}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm truncate text-center">
                        {item.bom}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm truncate text-center">
                        {item.partners}
                      </td>
                      <td className="px-6 py-4 truncate text-center">
                        {isEmergency ? (
                          <span className="inline-flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded text-xs font-bold shadow-3xs animate-pulse truncate">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            {item.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold truncate">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            {item.statusLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(item.id);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          보러가기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplyChainMapList;
