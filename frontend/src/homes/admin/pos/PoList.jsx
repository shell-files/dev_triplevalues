import React from "react";
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-xs text-left table-fixed min-w-[1000px]">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold">
                <th className="px-3 py-3 truncate">PO 번호</th>
                <th className="px-3 py-3 truncate">제품</th>
                <th className="px-3 py-3 truncate">폭(mm)</th>
                <th className="px-3 py-3 truncate">길이(mm)</th>
                <th className="px-3 py-3 truncate">중량(mm)</th>
                <th className="px-3 py-3 truncate">부피(L)</th>
                <th className="px-3 py-3 truncate">지름(mm)</th>
                <th className="px-3 py-3 truncate">재질</th>
                <th className="px-3 py-3 truncate">수량(ton)</th>
                <th className="px-3 py-3 truncate">총액($)</th>
                <th className="px-3 py-3 truncate">납기 예정일</th>
                <th className="px-3 py-3 text-center truncate">상태</th>
              </tr>
            </thead>
            <tbody>
              {PO_MOCK_DATA.map((row) => (
                <tr key={row.po_id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-3 py-3 text-[#03a94d] font-bold truncate" title={row.po_id}>
                    {row.po_id}
                  </td>
                  <td className="px-3 py-3 text-gray-900 font-medium truncate" title={row.product}>
                    {row.product}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.width ?? ""}>
                    {formatValue(row.width)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.length ?? ""}>
                    {formatValue(row.length)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.weight ?? ""}>
                    {formatValue(row.weight)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.volume ?? ""}>
                    {formatValue(row.volume)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.diameter ?? ""}>
                    {formatValue(row.diameter)}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate" title={row.material}>
                    {row.material}
                  </td>
                  <td className="px-3 py-3 font-bold text-gray-900 truncate" title={row.qty}>
                    {row.qty}
                  </td>
                  <td className="px-3 py-3 text-gray-800 truncate" title={`$${row.total.toLocaleString()}`}>
                    ${row.total.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-gray-500 truncate" title={row.delivery}>
                    {row.delivery}
                  </td>
                  <td className="px-3 py-3 text-center truncate">
                    {getStatusBadge(row.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PoList;
