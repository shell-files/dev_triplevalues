import React, { useState } from "react";
import { Card } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";
import CircleIcon from "@components/Common/Icons/CircleIcon";

const PartnerList = ({ userRole, partnerRegistration, setSelPartner, apiCompanies, loginData }) => {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const companies = (apiCompanies || []).filter((c) => c.tier !== 0);

  const g = (c, key) => {
    if (key === "id") return c.id || c.partner_id;
    if (key === "risk") return c.risk || c.risk_level || "";
    if (key === "short") return c.short || c.short_name || "";
    if (key === "tierLabel") return c.tierLabel || c.tier_label || "";
    return c[key];
  };

  const getTierTheme = (tier) => {
    if (tier === 1) {
      return {
        color: "#03a94d",
        bgClass: "bg-emerald-50 text-emerald-700 border-emerald-100"
      };
    }
    if (tier === 2) {
      return {
        color: "#0ea5e9",
        bgClass: "bg-sky-50 text-sky-700 border-sky-100"
      };
    }
    if (tier === 3) {
      return {
        color: "#8b5cf6",
        bgClass: "bg-violet-50 text-violet-700 border-violet-100"
      };
    }
    return {
      color: "#64748b",
      bgClass: "bg-slate-50 text-slate-500 border-slate-100"
    };
  };

  const totalCompanies = companies.length;
  const highRiskCount = companies.filter((c) => g(c, "risk") === "고위험").length;

  const filtered = companies.filter((c) => {
    const matchSearch = g(c, "short").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || g(c, "tierLabel").includes(tierFilter);
    const matchRisk = riskFilter === "all" || g(c, "risk") === riskFilter;
    return matchSearch && matchTier && matchRisk;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#03a94d] tracking-tight">협력사 정보 관리</h1>
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
            const theme = getTierTheme(c.tier);
            return (
              <Card key={g(c, "id")} className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer select-none bg-white"
                  onClick={() => {
                    if (setSelPartner) setSelPartner(c);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CircleIcon className="w-5 h-5" color={theme.color} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{g(c, "short")}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${theme.bgClass}`}>{g(c, "tierLabel")}</span>
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
                      상세 보기
                    </button>
                  </div>
                </div>
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
