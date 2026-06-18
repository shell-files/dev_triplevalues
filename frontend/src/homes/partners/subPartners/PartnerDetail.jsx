import React, { useState, useEffect } from "react";
import { Card } from "@components/Common/Card";
import { GET } from "@utils/Network";

// const MOCK_FACTORIES = [
//   {
//     id: 1,
//     factory_name: "인천 송도 합금 제1공장",
//     address: "인천광역시 연수구 송도과학로 32",
//     operation_status: "가동",
//     utilization_rate: 65,
//     scope1_emissions: 1840,
//     scope2_emissions: 920,
//     feoc_raw_material_ratio: 0,
//     trir_safety_rate: 0.05
//   },
//   {
//     id: 2,
//     factory_name: "경기 화성 원료 제2공장",
//     address: "경기도 화성시 향남읍 제약단지로 55",
//     operation_status: "정비",
//     utilization_rate: 35,
//     scope1_emissions: 980,
//     scope2_emissions: 460,
//     feoc_raw_material_ratio: 1.2,
//     trir_safety_rate: 0.12
//   }
// ];

const PartnerDetail = ({ partner, onBack, loginData }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [factories, setFactories] = useState([]);

  const p = partner || {};
  const pid = p.partner_id || p.id;

  useEffect(() => {
    if (!pid) return;

    GET(`/company/${pid}`)
      .then((json) => {
        if (json.status && json.data && json.data.factories && json.data.factories.length > 0) {
          setFactories(json.data.factories || []);
        }
        // else {
        //   setFactories(MOCK_FACTORIES);
        // }
      })
      .catch((err) => {
        console.error("공장 정보 조회 실패:", err);
        // setFactories(MOCK_FACTORIES);
      });
  }, [pid]);

  const getTierBadgeClass = (tier) => {
    if (tier === 1) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (tier === 2) return "bg-sky-50 text-sky-700 border border-sky-100";
    if (tier === 3) return "bg-purple-50 text-purple-700 border border-purple-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const formatNum = (val) =>
    val === undefined || val === null || val === "" ? "-" : Number(val).toLocaleString();

  const renderCertBadge = (val) => {
    const isY = val === "Y";
    return (
      <span
        className={
          "inline-block text-[12px] px-2 py-0.5 rounded font-bold border text-center " +
          (isY
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-600 border-red-100")
        }
      >
        {isY ? "Y (준수)" : "N (미준수)"}
      </span>
    );
  };

  const renderOperationStatusBadge = (status) => {
    const s = status || "가동";
    if (s === "가동") {
      return (
        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[12px]">
          가동
        </span>
      );
    }
    if (s === "정지") {
      return (
        <span className="bg-amber-50 text-amber-600 border border-amber-200 font-bold px-2 py-0.5 rounded text-[12px]">
          정지
        </span>
      );
    }
    if (s === "폐쇄") {
      return (
        <span className="bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded text-[12px]">
          폐쇄
        </span>
      );
    }
    if (s === "정비") {
      return (
        <span className="bg-blue-50 text-blue-600 border border-blue-200 font-bold px-2 py-0.5 rounded text-[12px]">
          정비
        </span>
      );
    }
    return (
      <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded text-[12px]">
        {s}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard']">
      {/* 뒤로가기 버튼 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      {/* 기본 요약 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">
              {p.short || p.short_name || p.company_name || "미지정"}
            </h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            파트너 코드: {pid} | 대표자: {p.ceo_name || p.ceo || "정보 없음"}
          </p>
        </div>
      </div>

      {/* 탭 내비게이션 */}
      <div className="flex border-b border-gray-200 text-base overflow-x-auto select-none">
        {[
          ["info", "협력사 정보"],
          ["factory", "공장 정보"],
        ].map((tab) => (
          <button
            key={tab[0]}
            onClick={() => setActiveTab(tab[0])}
            className={
              "px-5 py-3 font-bold border-b-2 tracking-tight whitespace-nowrap transition cursor-pointer " +
              (activeTab === tab[0]
                ? "border-[#03a94d] text-[#03a94d]"
                : "border-transparent text-gray-400 hover:text-gray-600")
            }
          >
            {tab[1]}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="space-y-6">
        {/* 탭1: 하위 협력사 정보 */}
        {activeTab === "info" && (
          <div className="flex flex-col space-y-6 animate-fade-in">
            {/* 기본 협력사 정보 */}
            <Card className="p-5 space-y-4">
              <div className="border-b border-gray-100 pb-2 mb-2">
                <h3 className="text-base font-bold text-[#03a94d]">기본 협력사 정보</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  ["기업명", p.company_name],
                  ["대표자명", p.ceo_name],
                  ["사업자등록번호", p.biz_no],
                  ["설립일", p.founded],
                  ["대표 이메일 주소", p.email || "-"],
                  ["기업 규모", p.size],
                  ["소재 국가", p.country],
                  ["소재지", p.address],
                ].map((pair, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                  >
                    <span className="text-gray-400 font-semibold">{pair[0]}</span>
                    <span className="font-bold text-gray-800">{pair[1] || "정보 없음"}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ESG 주요 지표 데이터 */}
            <Card className="p-5 space-y-4">
              <div className="border-b border-gray-100 pb-2 mb-2">
                <h3 className="text-base font-bold text-[#03a94d]">ESG 주요 지표 데이터</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  ["Scope 1 (tCO₂e)", formatNum(p.scope1)],
                  ["Scope 2 (tCO₂e)", formatNum(p.scope2)],
                  ["FEOC (% 사용 비율)", p.feoc_ratio != null ? `${p.feoc_ratio}%` : "-"],
                  ["TRIR (산업안전율)", p.trir != null ? p.trir : "-"],
                ].map((pair, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                  >
                    <span className="text-gray-400 font-semibold">{pair[0]}</span>
                    <span className="font-bold text-gray-800">{pair[1]}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 글로벌 인증 및 이니셔티브 준수 현황 */}
            <Card className="p-5 space-y-4">
              <div className="border-b border-gray-100 pb-2 mb-2">
                <h3 className="text-base font-bold text-[#03a94d]">글로벌 인증 및 이니셔티브 준수 현황</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  ["CMRT (분쟁광물 보고)", p.cmrt],
                  ["EMAT (배터리·광물 추적)", p.emat],
                  ["ISO 14001 (환경경영)", p.iso14001],
                  ["ISO 45001 (안전보건)", p.iso45001],
                  ["IATF 16949 (품질경영)", p.iatf],
                  ["RBA (책임 비즈니스)", p.rba],
                  ["RMAP (책임 광물 보증)", p.rmap],
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                  >
                    <span className="text-gray-400 font-semibold">{item[0]}</span>
                    {renderCertBadge(item[1])}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 탭2: 협력사 공장 정보 */}
        {activeTab === "factory" && (
          <div className="space-y-6 animate-fade-in">
            {/* ESG 가중합산 요약 */}
            <Card className="p-6 bg-white space-y-4">
              <div className="border-b border-gray-100 pb-2 mb-2">
                <h3 className="text-base font-bold text-[#03a94d]">ESG 가중합산 요약 (공장별 이용 비율 반영)</h3>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                {[
                  ["Scope 1", `${formatNum(p.scope1)} tCO₂e`],
                  ["Scope 2", `${formatNum(p.scope2)} tCO₂e`],
                  ["FEOC 비중", `${p.feoc_ratio || 0}%`],
                  ["TRIR", p.trir || 0],
                ].map((pair, i) => (
                  <div key={i}>
                    <div className="text-gray-400 font-semibold">{pair[0]}</div>
                    <div className="font-bold text-gray-800 mt-1">{pair[1]}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 공장 목록 */}
            <Card className="p-6 bg-white space-y-4">
              <div className="border-b border-gray-100 pb-2 mb-4">
                <h3 className="text-base font-bold text-[#03a94d]">공장 목록 ({factories.length}개)</h3>
              </div>
              <div className="space-y-3">
                {factories.length > 0 ? (
                  factories.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="border border-gray-200 bg-white rounded-xl p-4 space-y-3 shadow-3xs"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-gray-900 text-sm">
                            {f.factory_name || `공장 ${idx + 1}`}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {f.address || f.factory_address || "-"}
                          </span>
                        </div>
                        {renderOperationStatusBadge(f.operation_status)}
                      </div>
                      <div className="grid grid-cols-5 border border-gray-200 rounded-lg divide-x divide-gray-200 bg-white text-sm">
                        {[
                          ["이용 비율", `${f.utilization_rate || 0}%`],
                          ["Scope 1", `${formatNum(f.scope1_emissions || f.scope1)} tCO₂e`],
                          ["Scope 2", `${formatNum(f.scope2_emissions || f.scope2)} tCO₂e`],
                          ["FEOC", `${f.feoc_raw_material_ratio || f.feoc_ratio || 0}%`],
                          ["TRIR", f.trir_safety_rate || f.trir || 0],
                        ].map((pair, i) => (
                          <div key={i} className="p-3 text-center">
                            <div className="text-gray-400 font-semibold mb-1">{pair[0]}</div>
                            <div className="font-bold text-gray-800">{pair[1]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 text-sm py-6">등록된 공장 정보가 없습니다.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDetail;
