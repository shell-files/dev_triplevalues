import React, { useState, useEffect } from "react";
import { GET } from "@utils/Network";
import { RChip } from "@components/Common/Chip";

/* [v3.2] 행 클릭 토글 — AI 판단 근거/AI 권장 조치/실제내용 아코디언 표시 */

const RiskList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchField, setSearchField] = useState("company_name");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    GET("/risk/dashboard").then(json => {
      if (json.status && json.data) setAlerts(json.data.alerts || []);
    }).finally(() => setLoading(false));
  }, []);

  const getTierStats = (tierKey) => {
    const tierData = alerts.filter(a => {
      const tl = a.tierLabel || "";
      if (tierKey === "3") return tl.includes("3차");
      return tl.includes(tierKey + "차");
    });
    return {
      total: tierData.length,
      high: tierData.filter(a => a.severity === "고위험").length,
      medium: tierData.filter(a => a.severity === "중위험").length,
      low: tierData.filter(a => a.severity === "저위험").length,
    };
  };
  const t1 = getTierStats("1"), t2 = getTierStats("2"), t3 = getTierStats("3");

  const filteredData = alerts.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const fieldMap = { company_name: item.companyName, rule_name: item.ruleName, ai_reasoning: item.aiReasoning, ai_recommendation: item.aiRecommendation, answer_text: item.answerText };
      matchesSearch = (fieldMap[searchField] || "").toLowerCase().includes(query);
    }
    const tl = item.tierLabel || "";
    const matchesTier = tierFilter === "all" || tl.includes(tierFilter + "차");
    const matchesRisk = riskFilter === "all" || item.severity === riskFilter;
    return matchesSearch && matchesTier && matchesRisk;
  });

  const getRowClass = (riskLevel, isOpen) => {
    let base = "cursor-pointer transition-colors duration-150";
    if (riskLevel === "고위험") base += " bg-red-50/50 hover:bg-red-50";
    else if (riskLevel === "중위험") base += " bg-yellow-50/50 hover:bg-yellow-50";
    else base += " hover:bg-gray-50";
    if (isOpen) base += " border-b-0";
    return base;
  };

  const handleRowClick = (id) => {
    setOpenRow(prev => prev === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">공급망 리스크 관제</h2>
        <p className="text-sm text-gray-400 mt-0.5">공급망 전반의 핵심 ESG 지표별 글로벌 규제 위반 및 잠재 위험 모니터링</p>
      </div>

      {/* 3대 공급망 계층별 리스크 KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-[#03a94d] flex flex-col justify-between">
          <div><p className="text-xs font-semibold text-emerald-600">정련</p><h4 className="text-base font-black text-emerald-800 mt-0.5">1차 협력사</h4></div>
          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">총 지표: <span className="font-bold text-gray-800">{t1.total}개</span></div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">고위험 {t1.high}</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">중위험 {t1.medium}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">저위험 {t1.low}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-[#0ea5e9] flex flex-col justify-between">
          <div><p className="text-xs font-semibold text-sky-500">제련</p><h4 className="text-base font-black text-sky-800 mt-0.5">2차 협력사</h4></div>
          <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">총 지표: <span className="font-bold text-gray-800">{t2.total}개</span></div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-semibold">고위험 {t2.high}</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">중위험 {t2.medium}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">저위험 {t2.low}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-b-5 border-b-[#8b5cf6] flex flex-col justify-between">
          <div><p className="text-xs font-semibold text-violet-500">채굴</p><h4 className="text-base font-black text-violet-800 mt-0.5">3차 협력사</h4></div>
          <div className="mt-4 pt-3 border-t border-violet-100 flex items-center justify-between text-xs">
            <div className="text-gray-500 font-medium">총 지표: <span className="font-bold text-gray-800">{t3.total}개</span></div>
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
          <div className="flex flex-col sm:flex-row gap-12 sm:items-center flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 shrink-0">공급망 계층</span>
              <div className="flex flex-wrap gap-2">
                {[{ key: "all", label: "전체" }, { key: "1", label: "1차 협력사 (합금)" }, { key: "2", label: "2차 협력사 (제련)" }, { key: "3", label: "3차 협력사 (채굴)" }].map((opt) => {
                  const isActive = opt.key === tierFilter;
                  let cls = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";
                  if (isActive) { if (opt.key === "1") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-pointer"; else if (opt.key === "2") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-sky-50 border border-sky-300 text-sky-700 cursor-pointer"; else if (opt.key === "3") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-violet-50 border border-violet-300 text-violet-700 cursor-pointer"; else cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-[#03a94d] text-white cursor-pointer"; }
                  return <button key={opt.key} onClick={() => { setTierFilter(opt.key); setOpenRow(null); }} className={cls}>{opt.label}</button>;
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 shrink-0">리스크 등급</span>
              <div className="flex flex-wrap gap-2">
                {[{ key: "all", label: "전체" }, { key: "저위험", label: "저위험" }, { key: "중위험", label: "중위험" }, { key: "고위험", label: "고위험" }].map((opt) => {
                  const isActive = opt.key === riskFilter;
                  let cls = "px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent cursor-pointer";
                  if (isActive) { if (opt.key === "고위험") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-red-50 border border-red-300 text-red-700 cursor-pointer"; else if (opt.key === "중위험") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-amber-50 border border-amber-300 text-amber-700 cursor-pointer"; else if (opt.key === "저위험") cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-pointer"; else cls = "px-4 py-1.5 rounded-full text-sm font-bold bg-[#03a94d] text-white cursor-pointer"; }
                  return <button key={opt.key} onClick={() => { setRiskFilter(opt.key); setOpenRow(null); }} className={cls}>{opt.label}</button>;
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select value={searchField} onChange={e => setSearchField(e.target.value)} className="bg-slate-50 border border-gray-200 text-sm px-2.5 py-2 rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 shrink-0">
              <option value="company_name">협력사명</option><option value="rule_name">지표명</option><option value="ai_reasoning">AI 판단 근거</option><option value="ai_recommendation">AI 권장 조치</option><option value="answer_text">실제내용</option>
            </select>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색할 내용을 입력하세요. (협력사명, 지표명, 규제)" className="w-full lg:w-72 bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* 리스크 현황 테이블 + 토글 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-360px)] min-h-[350px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm text-center table-fixed min-w-[900px] border-collapse text-gray-700">
            <colgroup>
              <col className="w-[7%]" /><col className="w-[12%]" /><col className="w-[20%]" /><col className="w-[35%]" /><col className="w-[12%]" /><col className="w-[7%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold">
                <th className="pl-6 pr-3 py-3.5 text-center">No.</th>
                <th className="px-3 py-3.5 text-center">분류</th>
                <th className="px-3 py-3.5 text-center">협력사</th>
                <th className="px-3 py-3.5 text-center">지표명</th>
                <th className="px-3 py-3.5 text-center">리스크 등급</th>
                <th className="pl-3 pr-6 py-3.5 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400 text-base">데이터를 불러오는 중입니다...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400 text-base">검색 결과에 해당하는 리스크 현황이 없습니다.</td></tr>
              ) : (
                filteredData.map((row, idx) => {
                  const rowId = row.alertId || idx;
                  const isOpen = openRow === rowId;
                  return (
                    <React.Fragment key={rowId}>
                      <tr onClick={() => handleRowClick(rowId)} className={getRowClass(row.severity, isOpen) + " border-t"}>
                        <td className="pl-6 pr-3 py-4 text-center text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-4 text-center">
                          {row.tierLabel?.includes("1차") && <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">1차 협력사</span>}
                          {row.tierLabel?.includes("2차") && <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-bold text-xs">2차 협력사</span>}
                          {row.tierLabel?.includes("3차") && <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs">3차 협력사</span>}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-900 truncate">{row.companyName || "-"}</td>
                        <td className="px-3 py-4 text-center font-medium text-gray-500 truncate">{row.ruleName || "-"}</td>
                        <td className="px-3 py-4 text-center"><RChip v={row.severity} /></td>
                        <td className="pl-3 pr-6 py-4 text-center text-gray-400 font-bold text-sm">{isOpen ? "▲" : "▼"}</td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t-0">
                          <td colSpan="6" className="px-0 py-0">
                            <div className="bg-slate-50/80 border-t border-gray-100 px-8 py-5 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    <span className="text-xs font-bold text-gray-500">AI 판단 근거</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{row.aiReasoning || "데이터 없음"}</p>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    <span className="text-xs font-bold text-gray-500">AI 권장 조치</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{row.aiRecommendation || "데이터 없음"}</p>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-xs font-bold text-gray-500">실제내용</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{row.answerText || "데이터 없음"}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskList;
