import React, { useState } from "react";
import Card from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

const PartnerDetail = ({ partner, partnerRegistration, onBack }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [openCards, setOpenCards] = useState({});

  const p = partner || {};

  const handleToggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRiskColor = (risk) => {
    if (risk === "고위험") return "text-red-600 bg-red-50 border-red-100";
    if (risk === "중위험") return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs"
        >
          ← 목록으로 돌아가기
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{p.short || p.short_name || "미지정 파트너"}</h1>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{p.tierLabel || p.tier_label}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">파트너 코드: {p.id || p.partner_id} | 대표자: {p.ceo || "정보 없음"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">종합 위험 등급</span>
          <RChip v={p.risk || p.risk_level} />
        </div>
      </div>

      <div className="flex border-b border-gray-200 text-sm overflow-x-auto select-none">
        {[
          ["info", "기본 마스터 정보"],
          ["selfassess", "ESG 자가진단 내역"],
          ["evidence", "4대 서류 증빙자료"],
          ["factory", "운영 공장 및 실사 자산"],
        ].map((tab) => (
          <button
            key={tab[0]}
            onClick={() => setActiveTab(tab[0])}
            className={"px-4 py-2.5 font-bold border-b-2 tracking-tight whitespace-nowrap " + (activeTab === tab[0] ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            {tab[1]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">기업 기본 명세</h2>
              <div className="grid grid-cols-3 gap-y-3 text-xs leading-6">
                <span className="text-gray-400 font-semibold">공식 법인명</span>
                <span className="col-span-2 font-bold text-gray-800">{p.name || "정보 없음"}</span>
                <span className="text-gray-400 font-semibold">사업자등록번호</span>
                <span className="col-span-2 font-mono font-bold text-gray-800">{p.business_number || "정보 없음"}</span>
                <span className="text-gray-400 font-semibold">소재지 주소</span>
                <span className="col-span-2 font-bold text-gray-800">{p.address || "정보 없음"}</span>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">공급망 정보 트랙</h2>
              <div className="grid grid-cols-3 gap-y-3 text-xs leading-6">
                <span className="text-gray-400 font-semibold">업종/공급 분류</span>
                <span className="col-span-2 font-bold text-gray-800">{p.industry_type || "정보 없음"}</span>
                <span className="text-gray-400 font-semibold">최신 데이터 갱신일</span>
                <span className="col-span-2 font-mono font-bold text-gray-800">{p.updated_at || "정보 없음"}</span>
                <span className="text-gray-400 font-semibold">최초 등록 파이프라인</span>
                <span className="col-span-2 font-bold text-gray-800">{partnerRegistration || "시스템 자동화 등록"}</span>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "selfassess" && (
          <Card className="p-6 text-center border-dashed border-gray-200">
            <p className="text-sm text-gray-400">해당 협력사의 자가진단 이력 구조 및 CSDDD 대응 인프라 로직은 다음 고도화 마일스톤에서 수렴 연동될 구역입니다.</p>
          </Card>
        )}

        {activeTab === "evidence" && (
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">4대 규제 대응 서류 증빙자료 정합성 검증 원장</h2>
            <div className="space-y-2 text-xs">
              {[
                ["환경 경영 규제 대응 실적서 (ISO 14001 인증서 등)", p.iso14001, "env_doc.pdf"],
                ["안전 보건 예방 활동 실적서 (ISO 45001 인증서 등)", p.iso45001, "safety_doc.pdf"],
                ["자동차 부품 공급망 품질 원장 (IATF 16949 인증서 등)", p.iatf, "quality_doc.pdf"],
                ["글로벌 분쟁 광물 규제 대응 증빙서 (CMRT 레포트 등)", p.cmrt, "cmrt_report.xlsx"],
              ].map((doc, idx) => {
                const isY = doc[1] === "Y";
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/60 border border-gray-100 rounded-xl">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800">{doc[0]}</p>
                      <p className="text-[10px] text-gray-400 font-mono">파일명: {isY ? doc[2] : "미제출"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={"px-2 py-0.5 rounded font-extrabold text-[10px] border " + (isY ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>
                        {isY ? "검증 완료" : "증빙 누락"}
                      </span>
                      {isY && (
                        <button className="text-[10px] border border-gray-200 bg-white px-2 py-1 rounded font-semibold text-gray-600 hover:bg-gray-50 shadow-3xs">
                          다운로드
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeTab === "factory" && (
          <Card className="p-6 text-center border-dashed border-gray-200">
            <p className="text-sm text-gray-400">공장 자산별 실시간 탄소 배출량(Scope 1, 2) 및 FEOC 사양 그리드는 다음 연동 스프린트에서 연동될 구역입니다.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartnerDetail;
