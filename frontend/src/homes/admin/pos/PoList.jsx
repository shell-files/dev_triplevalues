import React, { useState, useEffect } from "react";
import { GET, POST } from "@utils/Network";
import { Chip } from "@components/Common/Chip";

/* [v2.0] PO_MOCK_DATA 삭제 — API 연동, 셀렉트 검색, 새로고침 시드 */

const PoList = () => {
  const [orders, setOrders] = useState([]);
  const [statusCount, setStatusCount] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState("ALL");
  const [searchField, setSearchField] = useState("po_id");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = () => {
    setLoading(true);
    GET("/po/list").then(json => {
      if (json.status && json.data) {
        setOrders(json.data.orders || []);
        setStatusCount(json.data.statusCount || {});
        setTotalCount(json.data.totalCount || 0);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSeed = () => {
    POST("/po/seed").then(json => {
      if (json.status) fetchData();
      else alert(json.message || "PO 생성 실패");
    });
  };

  const filteredData = orders.filter((row) => {
    const matchesStatus = currentStatus === "ALL" || row.status === currentStatus;
    const query = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const fieldMap = { po_id: row.poId, raw_name: row.rawName, components: row.components };
      matchesSearch = (fieldMap[searchField] || "").toLowerCase().includes(query);
    }
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return <Chip text="승인 대기" color="yellow" />;
      case "IN_PROGRESS": return <Chip text="진행 중" color="blue" />;
      case "COMPLETED": return <Chip text="입고 완료" color="green" />;
      case "CANCELLED": return <Chip text="취소" color="red" />;
      default: return <Chip text={status} color="slate" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">구매 발주 관리</h2>
          <p className="text-sm text-gray-400 mt-0.5">Al 3003 합금 영업용 PO 발주 계약 및 자재 입고 현황 원장</p>
        </div>
        <button onClick={handleSeed}
          className="px-4 py-2 rounded-lg shadow-sm text-sm font-bold text-white hover:opacity-90 transition"
          style={{ backgroundColor: "#03a94d" }}>
          구매 주문서 가져오기
        </button>
      </div>

      {/* 상태 필터 + 셀렉트 검색 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 shrink-0">발주 상태</span>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "ALL", label: "전체" },
                { key: "PENDING", label: "승인 대기" },
                { key: "IN_PROGRESS", label: "진행 중" },
                { key: "COMPLETED", label: "입고 완료" },
                { key: "CANCELLED", label: "취소" },
              ].map((stat) => {
                const isActive = stat.key === currentStatus;
                const count = stat.key === "ALL" ? totalCount : (statusCount[stat.key] || 0);
                let cls = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";
                if (isActive) {
                  if (stat.key === "PENDING") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-amber-50 border border-amber-300 text-amber-700 cursor-pointer";
                  else if (stat.key === "IN_PROGRESS") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-sky-50 border border-sky-300 text-sky-700 cursor-pointer";
                  else if (stat.key === "COMPLETED") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-pointer";
                  else if (stat.key === "CANCELLED") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-red-50 border border-red-300 text-red-700 cursor-pointer";
                  else cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-[#03a94d] text-white cursor-pointer";
                }
                return <button key={stat.key} onClick={() => setCurrentStatus(stat.key)} className={cls}>{stat.label} ({count})</button>;
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select value={searchField} onChange={e => setSearchField(e.target.value)}
              className="bg-slate-50 border border-gray-200 text-sm px-2.5 py-2 rounded-lg font-bold text-gray-700 focus:outline-none shrink-0">
              <option value="po_id">PO ID</option>
              <option value="raw_name">제품명</option>
              <option value="components">재질</option>
            </select>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full md:w-64 bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400" />
          </div>
        </div>
      </div>

      {/* PO 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[350px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm text-center table-fixed min-w-[1100px] border-collapse text-gray-700">
            <colgroup>
              <col className="w-[5%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" />
              <col className="w-[14%]" /><col className="w-[8%]" /><col className="w-[8%]" /><col className="w-[10%]" />
              <col className="w-[9%]" /><col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold">
                <th className="pl-6 px-3 py-3.5 text-center truncate">No.</th>
                <th className="px-3 py-3.5 text-center truncate">PO ID</th>
                <th className="px-3 py-3.5 text-center truncate">제품명</th>
                <th className="px-3 py-3.5 text-center truncate">발주처</th>
                <th className="px-3 py-3.5 text-center truncate">수주처</th>
                <th className="px-3 py-3.5 text-center truncate">수량(ton)</th>
                <th className="px-3 py-3.5 text-center truncate">총 금액</th>
                <th className="px-3 py-3.5 text-center truncate">납품일</th>
                <th className="px-3 py-3.5 text-center truncate">발주일</th>
                <th className="px-3 py-3.5 text-center truncate">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="py-10 text-gray-400">데이터를 불러오는 중입니다...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="10" className="py-10 text-gray-400">검색 결과에 해당하는 발주 데이터가 없습니다.</td></tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.id || idx} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-4 text-gray-400">{idx + 1}</td>
                    <td className="pl-6 pr-3 py-4 text-center text-[#03a94d] font-bold truncate" title={row.poId}>{row.poId}</td>
                    <td className="px-3 py-4 text-center text-gray-900 font-medium truncate" title={row.rawName}>{row.rawName}</td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.senderName}>{row.senderName}</td>
                    <td className="px-3 py-4 text-center text-gray-700 truncate" title={row.receiverName}>{row.receiverName}</td>
                    <td className="px-3 py-4 text-center text-gray-900 truncate">{row.qty.toLocaleString()}</td>
                    <td className="px-3 py-4 text-center text-gray-800 truncate">${row.total.toLocaleString()}</td>
                    <td className="px-3 py-4 text-center text-gray-500 truncate">{row.delivery}</td>
                    <td className="px-3 py-4 text-center text-gray-500 truncate">{row.createdAt}</td>
                    <td className="px-3 py-4 text-center">{getStatusBadge(row.status)}</td>
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
