import React, { useState } from "react";
import { Chip } from "@components/Common/Chip";

const PO_MOCK_DATA = [
  {
    po_id: "PO-2025-3003-001",
    product: "Al 3003-H14 판재",
    width: 1000,
    length: 2000,
    weight: 1.2,
    volume: 2.4,
    diameter: null,
    material: "Al-Mn 합금",
    qty: 45.00,
    unit_price: 3150.00,
    total: 141750.00,
    delivery: "2025-03-28",
    status: "COMPLETED",
  },
  {
    po_id: "PO-2025-3003-002",
    product: "Al 3003-H16 코일",
    width: 1200,
    length: null,
    weight: 0.6,
    volume: null,
    diameter: null,
    material: "Al-Mn 합금",
    qty: 60.00,
    unit_price: 3080.00,
    total: 184800.00,
    delivery: "2025-07-15",
    status: "COMPLETED",
  },
  {
    po_id: "PO-2026-3003-001",
    product: "Al 3003-H16 박판",
    width: 1000,
    length: null,
    weight: 0.5,
    volume: null,
    diameter: null,
    material: "Al-Mn 합금",
    qty: 55.00,
    unit_price: 3020.00,
    total: 166100.00,
    delivery: "2026-04-05",
    status: "CONFIRMED",
  },
  {
    po_id: "PO-2026-3003-002",
    product: "Al 3003-H14 판재",
    width: 1500,
    length: 3000,
    weight: 1.5,
    volume: 6.75,
    diameter: null,
    material: "Al-Mn 합금",
    qty: 42.00,
    unit_price: 3180.00,
    total: 133560.00,
    delivery: "2026-07-30",
    status: "PENDING",
  },
  {
    po_id: "PO-2026-3003-003",
    product: "Al 3003 튜브",
    width: null,
    length: 3000,
    weight: null,
    volume: null,
    diameter: 25.4,
    material: "Al-Mn 합금",
    qty: 120.00,
    unit_price: 1250.00,
    total: 150000.00,
    delivery: "2026-05-15",
    status: "CONFIRMED",
  },
];

const PoList = () => {
  const [currentStatus, setCurrentStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = PO_MOCK_DATA.filter((row) => {
    const matchesStatus = currentStatus === "ALL" || row.status === currentStatus;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      row.po_id.toLowerCase().includes(query) ||
      row.product.toLowerCase().includes(query) ||
      row.material.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Chip text="승인 대기" color="yellow" />;
      case "CONFIRMED":
        return <Chip text="발주 완료" color="blue" />;
      case "COMPLETED":
        return <Chip text="입고 완료" color="green" />;
      default:
        return <Chip text={status} color="slate" />;
    }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    return val;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">구매 발주 관리</h2>
        <p className="text-sm text-gray-400 mt-0.5">Al 3003 합금 영업용 PO 발주 계약 및 자재 입고 현황 원장</p>
      </div>

      {/* 상태 태그 필터 패널 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* 좌측: 발주 상태 필터 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 shrink-0">발주 상태</span>
            <div className="flex flex-wrap gap-2" id="status-filter-container">
              {[
                { key: "ALL", label: "전체" },
                { key: "PENDING", label: "승인 대기" },
                { key: "CONFIRMED", label: "발주 완료" },
                { key: "COMPLETED", label: "입고 완료" }
              ].map((stat) => {
                const isActive = stat.key === currentStatus;
                let btnClass = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";

                if (isActive) {
                  if (stat.key === "PENDING") {
                    btnClass = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-amber-50 border border-amber-300 text-amber-700 cursor-pointer";
                  } else if (stat.key === "CONFIRMED") {
                    btnClass = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-blue-50 border border-blue-300 text-blue-700 cursor-pointer";
                  } else if (stat.key === "COMPLETED") {
                    btnClass = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-pointer";
                  } else {
                    btnClass = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-[#03a94d] text-white cursor-pointer";
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

          {/* 우측: 실시간 검색 인풋 */}
          <div className="flex items-center w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="PO ID, 제품명 또는 재질 검색..."
              className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm table-fixed min-w-[1000px] border-collapse text-gray-700">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold">
                <th className="pl-6 pr-3 py-3.5 text-center truncate">PO ID</th>
                <th className="px-3 py-3.5 text-center truncate">제품</th>
                <th className="px-3 py-3.5 text-center truncate">재질</th>
                <th className="px-3 py-3.5 text-center truncate">폭(mm)</th>
                <th className="px-3 py-3.5 text-center truncate">길이(mm)</th>
                <th className="px-3 py-3.5 text-center truncate">중량(kg)</th>
                <th className="px-3 py-3.5 text-center truncate">부피(L)</th>
                <th className="px-3 py-3.5 text-center truncate">지름(mm)</th>
                <th className="px-3 py-3.5 text-center truncate">수량(ton)</th>
                <th className="px-3 py-3.5 text-center truncate">총액($)</th>
                <th className="px-3 py-3.5 text-center truncate">납기 예정일</th>
                <th className="pl-3 pr-6 py-3.5 text-center truncate">상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-10 text-center text-gray-400 text-sm">
                    검색 결과가 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.po_id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                    <td className="pl-6 pr-3 py-4 text-center text-[#03a94d] font-bold truncate" title={row.po_id}>
                      {row.po_id}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-900 font-medium truncate" title={row.product}>
                      {row.product}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.material}>
                      {row.material}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.width ?? ""}>
                      {formatValue(row.width)}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.length ?? ""}>
                      {formatValue(row.length)}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.weight ?? ""}>
                      {formatValue(row.weight)}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.volume ?? ""}>
                      {formatValue(row.volume)}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.diameter ?? ""}>
                      {formatValue(row.diameter)}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-900 truncate" title={row.qty}>
                      {row.qty}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-800 truncate" title={`$${row.total.toLocaleString()}`}>
                      {row.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-500 truncate" title={row.delivery}>
                      {row.delivery}
                    </td>
                    <td className="pl-3 pr-6 py-4 text-center">
                      {getStatusBadge(row.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PoList;
