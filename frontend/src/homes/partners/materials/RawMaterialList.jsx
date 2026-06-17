import React, { useState } from "react";
import { Card } from "@components/Common/Card";

// masterData.js 규격에 준하는 RAW_MATERIALS 더미 데이터 정의
const MOCK_RAW_MATERIALS = [
  {
    id: "RM-001",
    po_id: "PO-2026-001",
    tier: 1,
    request_company: "(주)노벨리스코리아",
    submit_company: "케이알엠",
    material_name: "알루미늄 잉곳",
    request_date: "2026-06-01",
    approve_date: "2026-06-05",
    status: "승인 완료",
  },
  {
    id: "RM-002",
    po_id: "PO-2026-002",
    tier: 2,
    request_company: "케이알엠",
    submit_company: "대일금속",
    material_name: "알루미늄 스크랩",
    request_date: "2026-06-10",
    approve_date: "2026-06-12",
    status: "승인 완료",
  },
  {
    id: "RM-003",
    po_id: "PO-2026-003",
    tier: 3,
    request_company: "대일금속",
    submit_company: "삼우금속",
    material_name: "규소 첨가제",
    request_date: "2026-06-15",
    approve_date: null,
    status: "승인 대기",
  },
  {
    id: "RM-004",
    po_id: "PO-2026-004",
    tier: 3,
    request_company: "대일금속",
    submit_company: "삼우금속",
    material_name: "마그네슘 합금",
    request_date: "2026-06-16",
    approve_date: null,
    status: "반려",
  },
  {
    id: "RM-005",
    po_id: "PO-2026-005",
    tier: 2,
    request_company: "케이알엠",
    submit_company: "대일금속",
    material_name: "알루미늄 슬라브",
    request_date: "2026-06-17",
    approve_date: null,
    status: "요청중",
  }
];

const RawMaterialList = ({ loginData, onSelectMaterial }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  // 로그인 데이터의 티어 추출 (기본값: 1차 협력사)
  const userTier = loginData?.tier !== undefined ? Number(loginData.tier) : 1;
  const isTier1 = userTier === 1;

  // 상태(Status)별 칩 렌더러 함수
  const renderStatusBadge = (status) => {
    let bgClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (status === "요청중") {
      bgClass = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (status === "승인 대기") {
      bgClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (status === "반려") {
      bgClass = "bg-red-50 text-red-700 border-red-200";
    } else if (status === "승인 완료") {
      bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${bgClass}`}>
        {status}
      </span>
    );
  };

  // 티어 문자열 포맷팅
  const formatTier = (tier) => {
    if (tier === 0) return "원청사";
    return `${tier}차 협력사`;
  };

  // 행 클릭 이벤트 핸들러 및 3차 협력사 예외 분기 구현
  const handleRowClick = (item) => {
    if (userTier === 3) {
      // 3차 협력사인 경우: 하위 검증 패널(2Depth-A) 진입을 차단하고 본인 제출용 입력 폼(2Depth-B)으로만 분기 처리
      alert(`3차 협력사 예외 처리 적용: '${item.material_name}'의 정보 제출 입력 폼으로 이동합니다.`);
      if (onSelectMaterial) {
        onSelectMaterial(item, "form");
      }
      return;
    }

    // 1차 및 2차 협력사의 경우 상태에 따른 2Depth 분기
    if (item.status === "승인 대기") {
      // 하위 협력사 제출 건 검증을 위한 2Depth-A 패널 진입
      alert(`하위 협력사 제출 자료 검증 패널로 이동합니다.`);
      if (onSelectMaterial) {
        onSelectMaterial(item, "verify");
      }
    } else if (item.status === "반려" || item.status === "요청중") {
      // 상위 차수 제출을 위한 2Depth-B 본인 폼 진입
      alert(`본인 원자재 규제 정보 작성 폼으로 이동합니다.`);
      if (onSelectMaterial) {
        onSelectMaterial(item, "form");
      }
    } else {
      // 승인 완료 등의 건은 읽기 전용 상세 화면으로 진입
      alert(`원자재 규제 정보 상세 조회 화면으로 이동합니다.`);
      if (onSelectMaterial) {
        onSelectMaterial(item, "detail");
      }
    }
  };

  // 필터링 및 검색 로직
  const filteredMaterials = MOCK_RAW_MATERIALS.filter((item) => {
    const matchesSearch = item.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.submit_company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "전체" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard'] bg-slate-50">
      {/* 페이지 헤더 배너 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">원자재 관리</h2>
          <p className="text-sm text-gray-400 mt-0.5">하위 공급망의 원자재 규제 준수 여부를 모니터링하고 상위 차수에 원자재 정보를 제출합니다.</p>
        </div>
      </div>

      {/* 검색 및 필터 패널 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center col-span-2">
          <input
            type="text"
            placeholder="제품명 또는 제출회사 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
          />
        </Card>
        <Card className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 font-bold transition"
          >
            <option value="전체">상태: 전체</option>
            <option value="요청중">요청중</option>
            <option value="승인 대기">승인 대기</option>
            <option value="반려">반려</option>
            <option value="승인 완료">승인 완료</option>
          </select>
        </Card>
      </div>

      {/* 마스터 데이터 테이블 */}
      <Card className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-semibold">
                {isTier1 && <th className="p-4 font-bold text-gray-700">PO ID</th>}
                <th className="p-4 font-bold text-gray-700">협력사 티어</th>
                <th className="p-4 font-bold text-gray-700">요청 회사</th>
                <th className="p-4 font-bold text-gray-700">제출 회사</th>
                <th className="p-4 font-bold text-gray-700">제품(원자재)명</th>
                <th className="p-4 font-bold text-gray-700">요청일</th>
                <th className="p-4 font-bold text-gray-700">승인일</th>
                <th className="p-4 font-bold text-gray-700">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    {isTier1 && <td className="p-4 font-semibold text-gray-900">{item.po_id}</td>}
                    <td className="p-4 text-gray-600 font-medium">{formatTier(item.tier)}</td>
                    <td className="p-4 text-gray-600">{item.request_company}</td>
                    <td className="p-4 text-gray-900 font-medium">{item.submit_company}</td>
                    <td className="p-4 text-gray-900 font-bold text-emerald-700">{item.material_name}</td>
                    <td className="p-4 text-gray-500">{item.request_date}</td>
                    <td className="p-4 text-gray-500">{item.approve_date || "-"}</td>
                    <td className="p-4">{renderStatusBadge(item.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isTier1 ? 8 : 7}
                    className="p-12 text-center text-gray-400 bg-white"
                  >
                    조회 조건에 부합하는 원자재 내역이 존재하지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RawMaterialList;
