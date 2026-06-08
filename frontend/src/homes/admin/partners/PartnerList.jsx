import React, { useState } from "react";
import Card from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

const PartnerList = ({ userRole, partnerRegistration, setSelPartner, apiCompanies }) => {
  const [selCo, setSelCo] = useState(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const companies = apiCompanies || [];

  const g = (c, key) => {
    if (key === "id") return c.id || c.partner_id;
    if (key === "risk") return c.risk || c.risk_level || "";
    if (key === "short") return c.short || c.short_name || "";
    if (key === "tierLabel") return c.tierLabel || c.tier_label || "";
    return c[key];
  };

  const totalCompanies = companies.length;
  const highRiskCount = companies.filter((c) => g(c, "risk") === "고위험").length;

  const filtered = companies.filter((c) => {
    const matchSearch = g(c, "short").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || g(c, "tierLabel") === tierFilter;
    const matchRisk = riskFilter === "all" || g(c, "risk") === riskFilter;
    return matchSearch && matchTier && matchRisk;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">협력사 정보 관리</h1>
          <p className="text-sm text-gray-400 mt-1">공급망 내 파트너사의 ESG 위험 수준 및 주요 글로벌 인증 준수 현황을 실시간 관제합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold">총 협력사 수</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalCompanies}개사</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-gray-100 text-slate-500 font-mono text-sm font-bold">N</div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold">고위험군 현황</p>
            <p className="text-2xl font-black text-red-600 mt-1">{highRiskCount}개사</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 text-red-500 font-mono text-sm font-bold">R</div>
        </Card>
      </div>

      <Card className="p-4 bg-slate-50/50 border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="협력사명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">모든 공급망 분류</option>
              <option value="1차">1차 협력사</option>
              <option value="2차">2차 협력사</option>
              <option value="3차">3차 협력사</option>
            </select>
          </div>
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">모든 리스크 상태</option>
              <option value="고위험">고위험</option>
              <option value="중위험">중위험</option>
              <option value="저위험">저위험</option>
            </select>
          </div>
        </div>
        {(search || tierFilter !== "all" || riskFilter !== "all") && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setSearch("");
                setTierFilter("all");
                setRiskFilter("all");
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
            >
              필터 초기화
            </button>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((c) => {
            const displayCo = c;
            const isSelected = selCo === g(c, "id");
            return (
              <Card key={g(c, "id")} className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer select-none bg-white"
                  onClick={() => setSelCo(isSelected ? null : g(c, "id"))}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{g(c, "short")}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{g(c, "tierLabel")}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">코드: {g(c, "id")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RChip v={g(c, "risk")} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSelPartner) setSelPartner(c);
                      }}
                      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-800"
                    >
                      상세 관제
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-gray-50 bg-slate-50/30 p-4 space-y-4 animate-fade-in">
                    <div>
                      <p className="text-xs font-bold text-gray-900 mb-2">7대 글로벌 규제 인증 문서 준수율 현황</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                        {[
                          ["ISO 14001 환경경영", displayCo.iso14001],
                          ["ISO 45001 안전보건", displayCo.iso45001],
                          ["IATF 16949 품질", displayCo.iatf],
                          ["RBA 책임비즈니스", displayCo.rba],
                          ["CMRT 분쟁광물", displayCo.cmrt],
                          ["RMAP 책임광물", displayCo.rmap],
                          ["EMAT 전기차광물", displayCo.emat],
                        ].map((pair, i) => {
                          const val = pair[1] || "N";
                          const isY = val === "Y";
                          return (
                            <div key={i} className="bg-white border border-gray-100 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
                              <p className="text-gray-400 font-semibold text-[10px] tracking-tight mb-1">{pair[0]}</p>
                              <span className={"inline-block text-[10px] px-1.5 py-0.5 rounded font-bold border text-center " + (isY ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                                {isY ? "Y (준수)" : "N (미준수)"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
            검색 및 필터 조건에 부합하는 협력사 정보가 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerList;
