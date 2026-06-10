import React, { useState } from "react";
import { RChip } from "@components/Common/Chip";

const RISK_MOCK_DATA = [
  {
    indicator_no: 1,
    company_name: "Comilog Gabon",
    tier: 3,
    name: "아동·강제노동 Zero",
    regs: "CSDDD / EU",
    actual_value: "pass",
    risk_level: "저위험",
  },
  {
    indicator_no: 2,
    company_name: "Comilog",
    tier: 3,
    name: "산업안전 TRIR",
    regs: "CSDDD, CSRD",
    actual_value: "2.15건/백만h",
    risk_level: "중위험",
  },
  {
    indicator_no: 3,
    company_name: "(주)케이알엠",
    tier: 2,
    name: "FEOC 지분 구조",
    regs: "IRA, FEOC",
    actual_value: "12.5%",
    risk_level: "고위험",
  },
  {
    indicator_no: 4,
    company_name: "(주)한성정밀",
    tier: 1,
    name: "Mn 함량",
    regs: "품질 표준 규격",
    actual_value: "pass",
    risk_level: "저위험",
  },
  {
    indicator_no: 5,
    company_name: "(주)노벨리스코리아",
    tier: 1,
    name: "FEOC Mn·Cu 공급사",
    regs: "IRA, FEOC",
    actual_value: "8.1%",
    risk_level: "중위험",
  },
  {
    indicator_no: 6,
    company_name: "노벨리스코리아",
    tier: 3,
    name: "FEOC 원료 비중",
    regs: "미국 IRA 규제",
    actual_value: "pass",
    risk_level: "저위험",
  },
];

const RiskList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // 공급망 차수별 요약 데이터 계산
  const getTierStats = (tierNum) => {
    const tierData = RISK_MOCK_DATA.filter((item) => item.tier === tierNum);
    const total = tierData.length;
    const high = tierData.filter((item) => item.risk_level === "고위험").length;
    const medium = tierData.filter((item) => item.risk_level === "중위험").length;
    const low = tierData.filter((item) => item.risk_level === "저위험").length;
    return { total, high, medium, low };
  };

  const t1 = getTierStats(1);
  const t2 = getTierStats(2);
  const t3 = getTierStats(3);

  // 다중 필터링 적용
  const filteredData = RISK_MOCK_DATA.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      item.company_name.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.regs.toLowerCase().includes(query);

    const matchesTier = tierFilter === "all" || item.tier === parseInt(tierFilter, 10);

    const matchesRisk = riskFilter === "all" || item.risk_level === riskFilter;

    return matchesSearch && matchesTier && matchesRisk;
  });

  const getRowClass = (riskLevel) => {
    if (riskLevel === "고위험") return "border-t bg-red-50/50 hover:bg-red-50 transition-colors duration-150";
    if (riskLevel === "중위험") return "border-t bg-yellow-50/50 hover:bg-yellow-50 transition-colors duration-150";
    return "border-t hover:bg-gray-50 transition-colors duration-150";
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">공급망 리스크 관제</h2>
        <p className="text-sm text-gray-400 mt-0.5">공급망 전반의 핵심 ESG 지표별 글로벌 규제 위반 및 잠재 위험 모니터링</p>
      </div>

      {/* 3대 공급망 계층별 리스크 KPI 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1차 협력사 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-blue-500 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-500">정련</p>
            <h4 className="text-base font-black text-blue-800 mt-0.5">1차 협력사</h4>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">
              총 지표: <span className="font-bold text-gray-800">{t1.total}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">고위험 {t1.high}</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">중위험 {t1.medium}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">저위험 {t1.low}</span>
            </div>
          </div>
        </div>

        {/* 2차 협력사 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-purple-500 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-500">제련</p>
            <h4 className="text-base font-black text-purple-800 mt-0.5">2차 협력사</h4>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">
              총 지표: <span className="font-bold text-gray-800">{t2.total}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">고위험 {t2.high}</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">중위험 {t2.medium}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">저위험 {t2.low}</span>
            </div>
          </div>
        </div>

        {/* 3차 협력사 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-orange-500 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-orange-500">채굴</p>
            <h4 className="text-base font-black text-orange-800 mt-0.5">3차 협력사</h4>
          </div>
          <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">
              총 지표: <span className="font-bold text-gray-800">{t3.total}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">고위험 {t3.high}</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">중위험 {t3.medium}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">저위험 {t3.low}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 패널 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* 좌측: 계층 및 리스크 태그 필터 */}
          <div className="flex flex-col sm:flex-row gap-12 sm:items-center flex-wrap">
            {/* 계층 필터 */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 shrink-0">공급망 계층</span>
              <div className="flex flex-wrap gap-2" id="tier-filter-container">
                {[
                  { key: "all", label: "전체" },
                  { key: "1", label: "1차 협력사 (합금)" },
                  { key: "2", label: "2차 협력사 (제련)" },
                  { key: "3", label: "3차 협력사 (채굴)" },
                ].map((opt) => {
                  const isActive = opt.key === tierFilter;
                  let btnClass =
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";

                  if (isActive) {
                    if (opt.key === "1") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-blue-50 border border-blue-300 text-blue-700 cursor-pointer";
                    } else if (opt.key === "2") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-purple-50 border border-purple-300 text-purple-700 cursor-pointer";
                    } else if (opt.key === "3") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-orange-50 border border-orange-300 text-orange-700 cursor-pointer";
                    } else {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-[#03a94d] text-white cursor-pointer";
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => setTierFilter(opt.key)}
                      className={btnClass}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 리스크 필터 */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 shrink-0">리스크 등급</span>
              <div className="flex flex-wrap gap-2" id="risk-filter-container">
                {[
                  { key: "all", label: "전체" },
                  { key: "저위험", label: "저위험" },
                  { key: "중위험", label: "중위험" },
                  { key: "고위험", label: "고위험" },
                ].map((opt) => {
                  const isActive = opt.key === riskFilter;
                  let btnClass =
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";

                  if (isActive) {
                    if (opt.key === "고위험") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-red-50 border border-red-300 text-red-700 cursor-pointer";
                    } else if (opt.key === "중위험") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-amber-50 border border-amber-300 text-amber-700 cursor-pointer";
                    } else if (opt.key === "저위험") {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-pointer";
                    } else {
                      btnClass =
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-[#03a94d] text-white cursor-pointer";
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => setRiskFilter(opt.key)}
                      className={btnClass}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 우측: 실시간 검색 인풋 */}
          <div className="flex items-center w-full lg:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색할 내용을 입력하세요. (협력사명, 지표명, 규제)"
              className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 리스크 현황 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-360px)] min-h-[350px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm text-center table-fixed min-w-[1000px] border-collapse text-gray-700" id="risk-table">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold">
                <th className="pl-6 pr-3 py-3.5 text-center truncate">No.</th>
                <th className="px-3 py-3.5 text-center truncate">분류</th>
                <th className="px-3 py-3.5 text-center truncate">협력사</th>
                <th className="px-3 py-3.5 text-center truncate">지표명</th>
                <th className="px-3 py-3.5 text-center truncate">적용 규제</th>
                <th className="px-3 py-3.5 text-center truncate">현재 데이터</th>
                <th className="pl-3 pr-6 py-3.5 text-center truncate">리스크 등급</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400 text-base">
                    검색 결과에 해당하는 리스크 현황이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.indicator_no} className={getRowClass(row.risk_level)}>
                    <td className="pl-6 pr-3 py-4 text-center text-gray-400 truncate">{row.indicator_no}</td>
                    <td className="px-3 py-4 text-center truncate">
                      {row.tier === 1 && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                          1차 협력사
                        </span>
                      )}
                      {row.tier === 2 && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs">
                          2차 협력사
                        </span>
                      )}
                      {row.tier === 3 && (
                        <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs">
                          3차 협력사
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-gray-900 truncate" title={row.company_name}>{row.company_name}</td>
                    <td className="px-3 py-4 text-center font-medium text-gray-500 truncate" title={row.name}>{row.name}</td>
                    <td className="px-3 py-4 text-center text-gray-500 truncate" title={row.regs}>{row.regs}</td>
                    <td className="px-3 py-4 text-center text-gray-600 truncate" title={row.actual_value}>{row.actual_value}</td>
                    <td className="pl-3 pr-6 py-4 text-center">
                      <RChip v={row.risk_level} />
                    </td>
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

export default RiskList;
