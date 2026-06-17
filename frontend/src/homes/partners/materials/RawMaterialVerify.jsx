import React, { useState } from "react";
import { Card } from "@components/Common/Card";

const RawMaterialVerify = ({ material, loginData, onVerifyAction, onBack }) => {
  const [rejectedFields, setRejectedFields] = useState([]);
  const [rejectReason, setRejectReason] = useState("");

  // 로그인 데이터의 티어 추출 및 3차 협력사 가드 처리
  const userTier = loginData?.tier !== undefined ? Number(loginData.tier) : 1;
  const isTier1 = userTier === 1;

  if (userTier === 3) {
    return (
      <div className="p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard']">
        <div>
          <button onClick={onBack} className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            돌아가기
          </button>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold">
          3차 협력사는 최하위 공급망으로 하위 차수가 존재하지 않아 이 검증 패널에 진입할 수 없습니다.
        </div>
      </div>
    );
  }

  // 모의 상세 데이터 정의 (화학 성분 및 RoHS 수치)
  const detailData = {
    composition: {
      aluminum: "98.5%",
      silicon: "0.8%",
      iron: "0.5%",
      copper: "0.2%"
    },
    rohs: {
      lead: "합격 (0.01%)",
      cadmium: "합격 (0.002%)",
      mercury: "합격 (0.005%)",
      chromium: "합격 (0.015%)"
    },
    document: "RoHS_Chemical_Analysis_2026.pdf"
  };

  // 반려 마킹 토글 핸들러
  const toggleFieldMark = (field) => {
    setRejectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  // 승인 제출 핸들러
  const handleApproveSubmit = () => {
    if (window.confirm(`'${material?.material_name}' 규제 정보 제출 건을 승인하시겠습니까?`)) {
      alert("원자재 규제 정보가 최종 승인 처리되었습니다.");
      if (onVerifyAction) {
        onVerifyAction(material.id, "승인 완료", null);
      }
    }
  };

  // 반려 제출 핸들러 및 필수값 검증
  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해 주세요.");
      return;
    }
    if (rejectedFields.length === 0) {
      alert("반려할 상세 항목을 최소 1개 이상 체크하여 마킹해 주세요.");
      return;
    }

    if (window.confirm("선택한 항목들을 반려 처리하시겠습니까?")) {
      alert("원자재 규제 정보가 반려 처리되었습니다.");
      if (onVerifyAction) {
        onVerifyAction(material.id, "반려", {
          reason: rejectReason,
          fields: rejectedFields
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard'] bg-slate-50">
      {/* 상단 액션 및 네비게이션 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          검증 취소 및 목록으로 돌아가기
        </button>
      </div>

      {/* 페이지 헤더 배너 */}
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">하위 협력사 제출 정보 검증</h2>
        <p className="text-sm text-gray-400 mt-0.5">하위 차수에서 작성하여 상신한 제품 원자재의 성분 및 규제 준수 현황을 정밀 검증합니다.</p>
      </div>

      {/* 메인 2분할 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 좌측 2개 컬럼: 읽기 전용 규제 정보 명세 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. 제품 기본 정보 카드 */}
          <Card className={`p-5 bg-white border transition-all rounded-xl shadow-xs relative ${
            rejectedFields.includes("basic") ? "border-red-500 bg-red-50/20 border-2 shadow-sm" : "border-gray-100"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#03a94d]">제품 기본 정보</h3>
              <div className="flex items-center gap-2">
                {rejectedFields.includes("basic") && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    반려 마킹됨
                  </span>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectedFields.includes("basic")}
                    onChange={() => toggleFieldMark("basic")}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  반려 항목 마킹
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isTier1 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">PO ID</label>
                  <input
                    type="text"
                    value={material?.po_id || ""}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">제품(원자재)명</label>
                <input
                  type="text"
                  value={material?.material_name || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">제출 회사</label>
                <input
                  type="text"
                  value={material?.submit_company || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">요청 회사</label>
                <input
                  type="text"
                  value={material?.request_company || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
            </div>
          </Card>

          {/* 2. 화학 성분 정보 카드 */}
          <Card className={`p-5 bg-white border transition-all rounded-xl shadow-xs relative ${
            rejectedFields.includes("composition") ? "border-red-500 bg-red-50/20 border-2 shadow-sm" : "border-gray-100"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#03a94d]">화학 성분 함량 정보</h3>
              <div className="flex items-center gap-2">
                {rejectedFields.includes("composition") && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    반려 마킹됨
                  </span>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectedFields.includes("composition")}
                    onChange={() => toggleFieldMark("composition")}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  반려 항목 마킹
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">알루미늄(Al)</label>
                <input
                  type="text"
                  value={detailData.composition.aluminum}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">규소(Si)</label>
                <input
                  type="text"
                  value={detailData.composition.silicon}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">철(Fe)</label>
                <input
                  type="text"
                  value={detailData.composition.iron}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">구리(Cu)</label>
                <input
                  type="text"
                  value={detailData.composition.copper}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
            </div>
          </Card>

          {/* 3. 환경 규제 준수 상태 카드 */}
          <Card className={`p-5 bg-white border transition-all rounded-xl shadow-xs relative ${
            rejectedFields.includes("rohs") ? "border-red-500 bg-red-50/20 border-2 shadow-sm" : "border-gray-100"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#03a94d]">글로벌 환경 규제 상태 (RoHS 기준)</h3>
              <div className="flex items-center gap-2">
                {rejectedFields.includes("rohs") && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    반려 마킹됨
                  </span>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectedFields.includes("rohs")}
                    onChange={() => toggleFieldMark("rohs")}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  반려 항목 마킹
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">납(Pb)</label>
                <input
                  type="text"
                  value={detailData.rohs.lead}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">카드뮴(Cd)</label>
                <input
                  type="text"
                  value={detailData.rohs.cadmium}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">수은(Hg)</label>
                <input
                  type="text"
                  value={detailData.rohs.mercury}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">6가 크롬(Cr6+)</label>
                <input
                  type="text"
                  value={detailData.rohs.chromium}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>
            </div>
          </Card>

          {/* 4. 증빙서류 관리 카드 */}
          <Card className={`p-5 bg-white border transition-all rounded-xl shadow-xs relative ${
            rejectedFields.includes("document") ? "border-red-500 bg-red-50/20 border-2 shadow-sm" : "border-gray-100"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#03a94d]">증빙 자료 목록</h3>
              <div className="flex items-center gap-2">
                {rejectedFields.includes("document") && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    반려 마킹됨
                  </span>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectedFields.includes("document")}
                    onChange={() => toggleFieldMark("document")}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  반려 항목 마킹
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
                <span className="font-medium text-gray-700">{detailData.document}</span>
                <span className="text-xs text-emerald-600 font-bold">정상 등록됨</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 우측 1개 컬럼: 의사결정 제어 패널 */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">검증 의사결정</h3>

            <div className="space-y-4">
              <button
                onClick={handleApproveSubmit}
                className="w-full bg-[#03a94d] hover:bg-[#02823b] text-white py-3 rounded-lg font-bold shadow-sm transition cursor-pointer text-sm"
              >
                승인 완료
              </button>

              <div className="border-t border-gray-100 my-4 pt-4">
                <label className="block text-xs font-bold text-gray-500 mb-1.5">반려 사유 입력</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 시 구체적인 사유를 입력해 주세요."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 focus:border-[#03a94d] placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleRejectSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-sm transition cursor-pointer text-sm"
              >
                반려 처리
              </button>
            </div>
          </Card>

          {/* 마킹 현황 요약 보드 */}
          <Card className="p-5 bg-slate-50 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-600 mb-2">마킹된 반려 타겟 목록</h4>
            {rejectedFields.length > 0 ? (
              <ul className="space-y-1.5">
                {rejectedFields.map((field) => (
                  <li key={field} className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    {field === "basic" && "제품 기본 정보"}
                    {field === "composition" && "화학 성분 함량 정보"}
                    {field === "rohs" && "글로벌 환경 규제 상태"}
                    {field === "document" && "증빙 자료 목록"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">마킹된 항목이 없습니다. 반려 시 마킹이 필수입니다.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialVerify;
