import React, { useState, useEffect } from "react";
import { Card } from "@components/Common/Card";
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
    return c[key];
  };

  const getTierTheme = (tier) => {
    if (tier === 1) {
      return {
        color: "#03a94d"
      };
    }
    if (tier === 2) {
      return {
        color: "#0ea5e9"
      };
    }
    if (tier === 3) {
      return {
        color: "#8b5cf6"
      };
    }
    return {
      color: "#64748b"
    };
  };

  const filtered = companies.filter((c) => {
    const name = g(c, "short") || c.company_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard']">
      {/* 페이지 헤더 배너 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">협력사 정보</h2>
          <p className="text-sm text-gray-400 mt-0.5">하위 공급망 파트너사 목록과 주요 ESG 정보 현황을 실시간 모니터링합니다.</p>
        </div>
        <div>
          <button
            onClick={() => {}}
            className="px-4 py-2 text-sm font-bold text-white rounded-lg hover:bg-[#02823b] transition shrink-0 bg-[#03a94d] shadow-sm cursor-pointer"
          >
            + 초대하기
          </button>
        </div>
      </div>

      {/* KPI 및 검색창 한 행 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI 카드 */}
        <Card className="p-5 flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-xl">
          <div>
            <p className="text-sm text-gray-400 font-medium">전체 협력사 수</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {loading ? "-" : `${companies.length}개사`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50/50 flex items-center justify-center border border-emerald-100/50 text-[#03a94d] font-mono text-sm font-bold">
            N
          </div>
        </Card>

        {/* 텍스트 검색창 */}
        <Card className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center">
          <div className="w-full">
            <input
              type="text"
              placeholder="협력사명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
            />
          </div>
        </Card>
      </div>

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
                  className="p-5 flex items-center justify-between cursor-pointer bg-white"
                  onClick={() => {
                    if (setSelPartner) setSelPartner(c);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CircleIcon className="w-5 h-5" color={theme.color} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">{g(c, "short")}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">코드: {g(c, "id")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSelPartner) setSelPartner(c);
                      }}
                      className="text-xs bg-[#03a94d] hover:bg-[#02823b] text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition cursor-pointer"
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
