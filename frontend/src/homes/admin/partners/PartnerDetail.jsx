// src/homes/admin/partners/PartnerDetail.jsx
// ────────────────────────────────────────────────────────
// [v2.1] 2026-06-09 — MOCK 데이터 전면 삭제, 전체 API 연동 (자가진단/증빙/공장)
// ────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { Card } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";
import { GET } from "@utils/Network";

const PartnerDetail = ({ partner, onBack, loginData }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [openCards, setOpenCards] = useState({});
  const [selectedVersion, setSelectedVersion] = useState("");

  /* [v2.1] API 데이터 state — MOCK 완전 대체 */
  const [selfAssessAnswers, setSelfAssessAnswers] = useState([]);
  const [selfAssessVersions, setSelfAssessVersions] = useState([]);
  const [categorizedFiles, setCategorizedFiles] = useState({ coc: [], selfassess: [], evidence: [], cert: [] });
  const [factories, setFactories] = useState([]);
  const [userChangedVersion, setUserChangedVersion] = useState(false);

  const p = partner || {};
  const pid = p.partner_id || p.id;

  /* [v2.1] API 데이터 조회 — 마운트 시 자가진단 + 파일 + 공장 */
  useEffect(() => {
    if (!pid) return;

    // 1) 상세 정보 (자가진단 + 공장 + 버전)
    GET(`/company/${pid}`)
      .then(json => {
        if (json.status && json.data) {
          setFactories(json.data.factories || []);
          setSelfAssessVersions(json.data.versions || []);
          setSelfAssessAnswers(json.data.selfAssessAnswers || []);
          if (json.data.versions?.length > 0) {
            setSelectedVersion(json.data.currentVersion || json.data.versions[0].version);
          }
        }
      });

    // 2) 파일 목록 (4영역 분류)
    GET(`/company/${pid}/files`)
      .then(json => {
        if (json.status) setCategorizedFiles(json.data || { coc: [], selfassess: [], evidence: [], cert: [] });
      });
  }, [pid]);

  /* [v3.0] 버전 변경 시 자가진단 재조회 — 사용자 수동 변경만 처리 (레이스 컨디션 방지) */
  useEffect(() => {
    if (!pid || !selectedVersion || !userChangedVersion) return;
    GET(`/company/${pid}/selfassess?version=${selectedVersion}`)
      .then(json => {
        if (json.status && json.data?.answers) setSelfAssessAnswers(json.data.answers);
      });
  }, [pid, selectedVersion, userChangedVersion]);

  const handleToggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  // ── UI 헬퍼 함수 (기존 디자인 유지) ──
  const getRiskColor = (risk) => {
    if (risk === "고위험") return "text-red-600 bg-red-50 border-red-100";
    if (risk === "중위험") return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };
  const getTierBadgeClass = (tier) => {
    if (tier === 1) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (tier === 2) return "bg-sky-50 text-sky-700 border border-sky-100";
    if (tier === 3) return "bg-purple-50 text-purple-700 border border-purple-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };
  const formatNum = (val) => (val === undefined || val === null || val === "") ? "-" : Number(val).toLocaleString();
  const renderCertBadge = (val) => {
    const isY = val === "Y";
    return <span className={"inline-block text-[10px] px-2 py-0.5 rounded font-bold border text-center " + (isY ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>{isY ? "Y (준수)" : "N (미준수)"}</span>;
  };
  const getPriorityBadgeClass = (priority) => {
    if (priority === "Critical") return "bg-red-100 text-red-800 border border-red-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    if (priority === "High") return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    return "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
  };
  const getRiskGradeBadgeClass = (riskGrade) => {
    if (riskGrade === "고위험") return "bg-red-100 text-red-800 border border-red-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    if (riskGrade === "중위험") return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    return "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
  };

  let baseURL = import.meta.env.VITE_API_URL_TV || "http://localhost:8000";

  /* [v2.1] 파일 다운로드 — 실제 API 호출 */
  const handleDownload = (file) => {
    const fname = file.filename || file.origin || file;
    const a = document.createElement("a");
    a.href = `${baseURL}/company/file/download/${fname}`;
    a.download = file.origin || fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* [v2.1] 파일 목록 렌더링 — API 파일 객체 지원 */
  const renderFileList = (files) => {
    if (!files || files.length === 0) return <p className="text-xs text-gray-400 py-3">등록된 파일이 없습니다.</p>;
    const isScrollable = files.length >= 5;
    return (
      <div className={isScrollable ? "max-h-60 overflow-y-auto pr-1 space-y-2" : "space-y-2"}>
        {files.map((file, idx) => {
          const displayName = typeof file === "string" ? file : (file.origin || file.filename || "파일");
          return (
            <div key={idx} className="bg-slate-50/60 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="bg-gray-100 text-gray-400 font-bold rounded-lg w-7 h-7 flex items-center justify-center text-xs shrink-0 font-mono">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-sm font-bold text-gray-800 truncate">{displayName}</span>
              </div>
              <button type="button" onClick={() => handleDownload(file)}
                className="text-xs px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg font-bold text-gray-700 transition shrink-0">
                다운로드
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs">← 목록으로 돌아가기</button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#03a94d] tracking-tight">{p.short || p.short_name || p.company_name || "미지정"}</h1>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getTierBadgeClass(p.tier)}`}>{p.tierLabel || p.tier_label}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">파트너 코드: {pid} | 대표자: {p.ceo_name || p.ceo || "정보 없음"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">종합 위험 등급</span>
          <RChip v={p.risk || p.risk_level} />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 text-sm overflow-x-auto select-none">
        {[["info","협력사 정보"],["selfassess","자가진단 내역"],["evidence","증빙 자료 확인"],["factory","공장 정보 확인"]].map(tab => (
          <button key={tab[0]} onClick={() => setActiveTab(tab[0])}
            className={"px-4 py-2.5 font-bold border-b-2 tracking-tight whitespace-nowrap " + (activeTab === tab[0] ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600")}>
            {tab[1]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* ═══ 협력사 정보 탭 ═══ */}
        {activeTab === "info" && (
          <div className="flex flex-col space-y-6">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">기본 협력사 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[["기업명", p.company_name],["대표자명", p.ceo_name],["사업자등록번호", p.biz_no],["설립일", p.founded],["대표 이메일 주소", p.email || "-"],["기업 규모", p.size],["소재 국가", p.country],["소재지", p.address]].map((pair, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                    <span className="text-gray-400 font-semibold">{pair[0]}</span>
                    <span className="font-bold text-gray-800">{pair[1] || "정보 없음"}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">ESG 주요 지표 데이터</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[["Scope 1 (tCO₂e)", formatNum(p.scope1)],["Scope 2 (tCO₂e)", formatNum(p.scope2)],["FEOC 원료 비중", p.feoc_ratio != null ? `${p.feoc_ratio}%` : "-"],["TRIR 산업안전율", p.trir != null ? p.trir : "-"]].map((pair, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                    <span className="text-gray-400 font-semibold">{pair[0]}</span>
                    <span className="font-mono font-bold text-gray-800">{pair[1]}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">글로벌 인증 및 이니셔티브 준수 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[["CMRT (분쟁광물 보고)", p.cmrt],["EMAT (배터리·광물 추적)", p.emat],["ISO 14001 (환경경영)", p.iso14001],["ISO 45001 (안전보건)", p.iso45001],["IATF 16949 (품질경영)", p.iatf],["RBA (책임 비즈니스)", p.rba],["RMAP (책임 광물 보증)", p.rmap]].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                    <span className="text-gray-400 font-semibold">{item[0]}</span>
                    {renderCertBadge(item[1])}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══ 자가진단 내역 탭 — API 데이터 ═══ */}
        {activeTab === "selfassess" && (
          <div className="space-y-3">
            <div className="w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 shadow-3xs mb-4">
              <span className="text-xs font-bold text-gray-600">버전:</span>
              <select value={selectedVersion} onChange={e => { setUserChangedVersion(true); setSelectedVersion(e.target.value); }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-400">
                {selfAssessVersions.length > 0 ? selfAssessVersions.map((v, i) => (
                  <option key={i} value={v.version}>v{v.version} ({v.answer_count || v.count || 0}건 · {v.created_at?.slice(0,10) || ""})</option>
                )) : <option value="">데이터 없음</option>}
              </select>
            </div>

            {selfAssessAnswers.length > 0 ? selfAssessAnswers.map((item, idx) => {
              const cardKey = `card_${item.id || idx}_${idx}`;
              const isSelected = !!openCards[cardKey];
              return (
                <Card key={cardKey} className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all">
                  <div className="p-4 flex items-center justify-between cursor-pointer select-none bg-white gap-4"
                    onClick={() => handleToggleCard(cardKey)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-gray-100 text-gray-400 font-black rounded-lg w-8 h-8 flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="font-bold text-gray-900 text-sm truncate md:whitespace-normal">{item.question || item.indicator_name || ""}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.priority && <span className={getPriorityBadgeClass(item.priority)}>우선순위: {(item.priority || "").toUpperCase()}</span>}
                      {(item.risk_level || item.risk_grade) && <span className={getRiskGradeBadgeClass(item.risk_level || item.risk_grade)}>평가: {item.risk_level || item.risk_grade}</span>}
                      <span className="text-gray-400 font-bold text-sm">{isSelected ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="border-t border-gray-150 p-5 bg-slate-50/40 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-semibold mb-1">지표명</span>
                          <span className="text-xs font-bold text-gray-700">{item.indicator_name || item.indicator || item.category || ""}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-semibold mb-1">증빙자료 필요 여부</span>
                          {(item.evidence_yn || item.evidence_required) === "Y"
                            ? <span className="inline-block text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">⚠️ 증빙서류 필수 제출</span>
                            : <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">✓ 증빙서류 선택</span>
                          }
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-semibold mb-1">협력사 답변</span>
                        <textarea readOnly disabled value={item.answer_text || item.answer || ""} className="w-full h-24 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none resize-none font-medium" />
                      </div>
                    </div>
                  )}
                </Card>
              );
            }) : <p className="text-center text-gray-400 text-sm py-10">자가진단 데이터가 없습니다.</p>}
          </div>
        )}

        {/* ═══ 증빙 자료 탭 — API 파일 데이터 ═══ */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            {[
              { title: "자가진단 완료 문서", key: "selfassess" },
              { title: "자가진단 증빙 자료", key: "evidence" },
              { title: "글로벌 인증 증빙 자료", key: "cert" },
              { title: "행동강령 준수 서약서", key: "coc" },
            ].map((section) => (
              <Card key={section.key} className="p-5 space-y-4">
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">{section.title}</h2>
                {renderFileList(categorizedFiles[section.key] || [])}
              </Card>
            ))}
          </div>
        )}

        {/* ═══ 공장 정보 탭 — API 공장 데이터 ═══ */}
        {activeTab === "factory" && (
          <Card className="p-6 bg-white">
            <div>
              <div className="font-bold text-emerald-600 text-sm mb-2">ESG 가중합산 요약 (공장별 이용 비율 반영)</div>
              <div className="grid grid-cols-4 border-b border-gray-200 pb-4 mb-4 text-xs">
                {[["Scope 1", `${formatNum(p.scope1)} tCO₂e`],["Scope 2", `${formatNum(p.scope2)} tCO₂e`],["FEOC 비중", `${p.feoc_ratio || 0}%`],["TRIR", p.trir || 0]].map((pair, i) => (
                  <div key={i}><div className="text-gray-400 font-semibold">{pair[0]}</div><div className="font-bold text-gray-800 mt-1">{pair[1]}</div></div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="border-b border-gray-900 pb-2 mb-4 font-bold text-gray-900 text-sm">
                공장 목록 ({factories.length}개)
              </div>
              <div className="space-y-3">
                {factories.length > 0 ? factories.map((f, idx) => (
                  <div key={f.id || idx} className="border border-gray-900 bg-white rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-gray-900 text-sm">{f.factory_name || `공장${idx+1}`}</span>
                        <span className="text-xs text-gray-400 mt-1">{f.address || f.factory_address || ""}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[11px]">
                        {f.operation_status || "가동중"}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 border border-gray-200 rounded-lg divide-x divide-gray-200 bg-white text-xs">
                      {[["이용 비율", `${f.utilization_rate || 0}%`],["Scope 1", `${formatNum(f.scope1_emissions || f.scope1)} tCO₂e`],["Scope 2", `${formatNum(f.scope2_emissions || f.scope2)} tCO₂e`],["FEOC", `${f.feoc_raw_material_ratio || f.feoc_ratio || 0}%`],["TRIR", f.trir_safety_rate || f.trir || 0]].map((pair, i) => (
                        <div key={i} className="p-3 text-center">
                          <div className="text-gray-400 font-semibold mb-1">{pair[0]}</div>
                          <div className="font-bold text-gray-800">{pair[1]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <p className="text-center text-gray-400 text-sm py-6">등록된 공장 정보가 없습니다.</p>}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartnerDetail;