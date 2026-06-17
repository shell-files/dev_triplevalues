import React, { useState, useEffect } from "react";
import { Card } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";
import CircleIcon from "@components/Common/Icons/CircleIcon";
import { POST } from "@utils/Network";

const PartnerList = ({ loginData, setSelPartner }) => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loginData?.partner_id) return;

    setLoading(true);
    POST("/company/list", {
      userRole: loginData?.role_name || "1차 협력사",
      parentId: loginData?.partner_id
    })
      .then((json) => {
        if (json.status && json.data?.companies) {
          setCompanies(json.data.companies);
        } else {
          setCompanies([]);
        }
      })
      .catch(() => {
        setCompanies([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loginData]);

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

  const filtered = companies.filter((c) => {
    const name = g(c, "short") || c.company_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-['Pretendard']">
      {/* 헤더 배너 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#03a94d] tracking-tight">협력사 정보</h1>
          <p className="text-sm text-gray-400 mt-1">하위 공급망 파트너사 목록과 주요 ESG 정보 현황을 실시간 모니터링합니다.</p>
        </div>
      </div>

      {/* 단일 KPI 카드 */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4 flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-xl">
          <div>
            <p className="text-xs text-gray-400 font-semibold">전체 협력사 수</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {loading ? "-" : `${companies.length}개사`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-gray-100 text-slate-500 font-mono text-sm font-bold">
            N
          </div>
        </Card>
      </div>

      {/* 텍스트 검색창 */}
      <Card className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
        <div className="w-full">
          <input
            type="text"
            placeholder="협력사명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
          />
        </div>
      </Card>

      {/* 리스트 출력 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
            데이터를 불러오는 중입니다...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((c) => {
            const tierNum = c.tier;
            const theme = getTierTheme(tierNum);
            return (
              <Card key={g(c, "id")} className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all rounded-xl shadow-xs">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer bg-white"
                  onClick={() => {
                    if (setSelPartner) setSelPartner(c);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CircleIcon className="w-5 h-5" color={theme.color} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{g(c, "short")}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${theme.bgClass}`}>
                          {g(c, "tierLabel")}
                        </span>
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
                      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-800 transition cursor-pointer"
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
            검색 조건에 부합하는 협력사 정보가 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerList;
