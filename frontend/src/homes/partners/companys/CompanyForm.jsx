import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";

const CompanyForm = ({
  formData,
  setFormData,
  certs,
  setCerts,
  fileStates,
  onSaveComplete,
  onCancel,
  loginData,
  apiCompany,
  isProfileIncomplete,
}) => {
  const {
    selfAssessFileName,
    setSelfAssessFileName,
    cocFileName,
    setCocFileName,
    certFileNames,
    setCertFileNames,
    evidenceFileNames,
    setEvidenceFileNames,
  } = fileStates;

  // 글로벌 인증 변경 핸들러
  const handleCertChange = (key, value) => {
    setCerts((prev) => ({ ...prev, [key]: value }));
  };

  // 파일 핸들러들
  const handleSelfAssessFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfAssessFileName(file.name);
    }
  };

  const handleCocFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCocFileName(file.name);
    }
  };

  const handleCertFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setCertFileNames((prev) => {
        const newNames = files.map((f) => f.name);
        return Array.from(new Set([...prev, ...newNames]));
      });
    }
  };

  const handleEvidenceFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEvidenceFileNames((prev) => {
        const newNames = files.map((f) => f.name);
        return Array.from(new Set([...prev, ...newNames]));
      });
    }
  };

  /* [v3.0] 양식 다운로드 — 차수별 */
  const handleDownloadSelfAssess = () => {
    const tier = loginData?.tier || 1;
    const tl = loginData?.tier_label || "";
    let fn = "";
    if (tier === 1) fn = "[양식]자가진단_체크리스트(1차 협력사)_v0.1.xlsx";
    else if (tier === 2) fn = "[양식]자가진단_체크리스트(2차 협력사)_v0.1.xlsx";
    else if (tier === 3 && tl.includes("A")) fn = "[양식]자가진단_체크리스트(3차-A(채굴))_v0.1.xlsx";
    else if (tier === 3) fn = "[양식]자가진단_체크리스트(3차-A+B(전체))_v0.1.xlsx";
    else fn = "[양식]자가진단_체크리스트(1차 협력사)_v0.1.xlsx";
    const base = import.meta.env.VITE_API_URL_TV || "http://localhost:8000";
    window.open(`${base}/company/file/sample/${encodeURIComponent(fn)}`, "_blank");
  };

  const handleDownloadCoC = () => {
    const base = import.meta.env.VITE_API_URL_TV || "http://localhost:8000";
    window.open(`${base}/company/file/sample/${encodeURIComponent("CoC_Agreement_Form.pdf")}`, "_blank");
  };

  // [v3.0] 폼 제출 — 유효성 검사 + API 등록/수정 + 파일 업로드
  const handleSubmit = async (e) => {
    e.preventDefault();
    const pid = loginData?.partner_id;
    if (!pid) { alert("로그인 정보가 없습니다."); return; }

    const required = ["companyName", "ceoName", "bizNo", "foundedDate", "address", "scope1", "scope2", "feocRatio", "trir"];
    for (let key of required) {
      if (!formData[key] && formData[key] !== 0) { alert("모든 기본 정보 및 ESG 지표 항목을 입력해주세요."); return; }
    }
    const certKeys = ["iso14001", "iso45001", "iatf16949", "rba", "rmap", "cmrt", "emat"];
    for (let ck of certKeys) { if (!certs[ck]) { alert("7대 글로벌 ESG 인증 여부를 모두 선택해주세요."); return; } }

    const existCerts = (fileStates.categorizedFiles?.cert || []).length;
    if ((fileStates.certFileObjs?.length || 0) === 0 && existCerts === 0) { alert("글로벌 인증 증빙서류를 최소 1개 이상 업로드해야 합니다."); return; }
    const existSA = (fileStates.categorizedFiles?.selfassess || []).length;
    if (!fileStates.selfAssessFileObj && existSA === 0) { alert("자가진단 완료 서류 파일을 업로드해주세요."); return; }
    const existEv = (fileStates.categorizedFiles?.evidence || []).length;
    if ((fileStates.evidenceFileObjs?.length || 0) === 0 && existEv === 0) { alert("증빙자료 파일을 1개 이상 업로드해주세요."); return; }
    const existCoc = (fileStates.categorizedFiles?.coc || []).length;
    if (!fileStates.cocFileObj && existCoc === 0) { alert("행동강령 준수 서약서 파일을 업로드해주세요."); return; }

    const needsUpdate = !!apiCompany;
    const apiData = {
      partnerId: pid, companyName: formData.companyName, ceoName: formData.ceoName,
      bizNo: formData.bizNo, founded: formData.foundedDate, address: formData.address,
      size: formData.companySize, country: formData.country,
      tier: Number(loginData?.tier) || 0, tierLabel: loginData?.tier_label || "",
      parentId: apiCompany?.parent_id || "",
      scope1: parseInt(formData.scope1) || 0, scope2: parseInt(formData.scope2) || 0,
      feocRatio: parseFloat(formData.feocRatio) || 0, trir: parseFloat(formData.trir) || 0,
      iso14001: certs.iso14001 || "N", iso45001: certs.iso45001 || "N",
      iatf: certs.iatf16949 || "N", rba: certs.rba || "N",
      rmap: certs.rmap || "N", cmrt: certs.cmrt || "N", emat: certs.emat || "N",
    };

    try {
      const res = needsUpdate ? await PUT(`/company/${pid}`, apiData) : await POST("/company/register", apiData);
      if (res && res.status === true) {
        const isEdit = needsUpdate && !isProfileIncomplete;
        alert("기업 정보가 성공적으로 " + (isEdit ? "수정" : "등록") + "되었습니다.");

        const baseURL = import.meta.env.VITE_API_URL_TV || "http://localhost:8000";
        const uploads = [];
        if (fileStates.cocFileObj) {
          const fd = new FormData(); fd.append("partnerId", pid); fd.append("file", fileStates.cocFileObj);
          uploads.push(fetch(`${baseURL}/company/file/coc`, { method: "POST", body: fd, credentials: "include" }).then(r => r.json()).then(r => { if (r.status) fileStates.setCocFileObj(null); }));
        }
        if (fileStates.selfAssessFileObj) {
          const fd = new FormData(); fd.append("partnerId", pid); fd.append("file", fileStates.selfAssessFileObj);
          uploads.push(fetch(`${baseURL}/company/file/selfassess`, { method: "POST", body: fd, credentials: "include" }).then(r => r.json()).then(r => {
            if (r.status) { fileStates.setSelfAssessFileObj(null); alert("자가진단 OCR 완료 (v" + (r.data?.version || 1) + ", " + (r.data?.total_answers || 0) + "개 답변)"); }
            else alert("자가진단 OCR 실패: " + (r.message || ""));
          }));
        }
        if (fileStates.evidenceFileObjs?.length > 0) {
          const fd = new FormData(); fd.append("partnerId", pid);
          fileStates.evidenceFileObjs.forEach(f => fd.append("files", f));
          uploads.push(fetch(`${baseURL}/company/file/evidence`, { method: "POST", body: fd, credentials: "include" }).then(r => r.json()).then(r => { if (r.status) fileStates.setEvidenceFileObjs([]); }));
        }
        if (fileStates.certFileObjs?.length > 0) {
          const fd = new FormData(); fd.append("partnerId", pid);
          fileStates.certFileObjs.forEach(f => fd.append("files", f));
          uploads.push(fetch(`${baseURL}/company/file/cert`, { method: "POST", body: fd, credentials: "include" }).then(r => r.json()).then(r => { if (r.status) fileStates.setCertFileObjs([]); }));
        }
        if (uploads.length > 0) await Promise.all(uploads).catch(e => console.error("파일 업로드 오류:", e));
        if (onSaveComplete) onSaveComplete({ ...apiData, partner_id: pid });
      } else { alert(res?.message || "저장 실패. 다시 시도해주세요."); }
    } catch (err) { alert("서버 연결 오류: " + (err.message || "")); }
  };

  return (
    <div id="company-form-section" className="w-full space-y-6 flex-1">
      {/* 페이지 헤더 배너 */}
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">기업 정보 등록</h2>
        <p className="text-sm text-gray-400 mt-0.5">플랫폼 연동을 위한 협력사 기본 정보 및 글로벌 인증 자산 마스터 관리</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          id="btn-cancel-form"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
        >
          취소
        </button>
      </div>

      <form id="frm-company-info" className="space-y-6" onSubmit={handleSubmit}>
        {/* 카드 1: 기본 정보 및 ESG 성과 지표 입력 */}
        <Card className="p-6">
          <CardHeader className="border-b border-gray-300 pb-3 mb-4">
            <CardTitle className="text-sm font-bold text-[#03a94d]">기본 정보 및 ESG 성과 지표 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 좌측: 기본 기업 정보 */}
              <div className="space-y-4">
                <h4 className="border-l-5 border-emerald-500 text-sm pl-2 font-bold text-gray-900 uppercase tracking-wider">기본 기업 정보</h4>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">기업명 *</label>
                  <input
                    type="text"
                    placeholder="예: (주)노벨리스코리아"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">대표자명 *</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.ceoName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ceoName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">사업자등록번호 *</label>
                  <input
                    type="text"
                    placeholder="예: 128-81-33210"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.bizNo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bizNo: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">설립일 *</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 transition-colors"
                    value={formData.foundedDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, foundedDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">소재지 *</label>
                  <input
                    type="text"
                    placeholder="예: 서울시 강남구 테헤란로 123"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">기업 규모 *</label>
                    <select
                      className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors bg-white"
                      value={formData.companySize}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, companySize: e.target.value }))
                      }
                      required
                    >
                      <option value="" disabled>
                        규모 선택
                      </option>
                      <option value="대기업">대기업</option>
                      <option value="중견기업">중견기업</option>
                      <option value="중소기업">중소기업</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">소재 국가 *</label>
                    <input
                      type="text"
                      placeholder="예: 대한민국"
                      className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 우측: 핵심 ESG 지표 */}
              <div className="space-y-4 md:border-l md:pl-6 md:border-gray-300">
                <h4 className="border-l-5 border-emerald-500 pl-2 text-sm font-bold text-gray-900 uppercase tracking-wider">핵심 ESG 지표</h4>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    Scope 1 배출량 (tCO2e) *
                  </label>
                  <input
                    type="number"
                    placeholder="예: 82000"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.scope1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scope1: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    Scope 2 배출량 (tCO2e) *
                  </label>
                  <input
                    type="number"
                    placeholder="예: 45000"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.scope2}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scope2: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    FEOC 원료 비중 (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="예: 12.5"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.feocRatio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, feocRatio: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">TRIR 산업안전율 *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="예: 0.15"
                    className="w-full bg-slate-50 border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition-colors"
                    value={formData.trir}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trir: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 카드 2: 글로벌 인증 준수 현황 */}
        <Card className="p-6">
          <CardHeader className="border-b border-gray-300 pb-3 mb-4">
            <CardTitle className="text-sm font-bold text-[#03a94d]">글로벌 인증 준수 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {Object.keys(certs).map((key) => (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="text-sm font-bold text-gray-700">
                    {key === "iso14001"
                      ? "ISO 14001 (환경경영인증)"
                      : key === "iso45001"
                        ? "ISO 45001 (안전보건인증)"
                        : key === "iatf16949"
                          ? "IATF 16949 (품질경영인증)"
                          : key === "rba"
                            ? "RBA (책임 비즈니스 인증)"
                            : key === "rmap"
                              ? "RMAP (책임 광물 보증 인증)"
                              : key === "cmrt"
                                ? "CMRT (분쟁광물 보고 인증)"
                                : key === "emat"
                                  ? "EMAT (광물 추적 보고 인증)"
                                  : key.toUpperCase()}{" "}
                    *
                  </span>
                  <div className="flex gap-4 mt-2 sm:mt-0">
                    <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name={key}
                        value="Y"
                        className="text-[#03a94d] focus:ring-[#03a94d]/30 cursor-pointer"
                        checked={certs[key] === "Y"}
                        onChange={() => handleCertChange(key, "Y")}
                        required
                      />
                      취득/이행 (Y)
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name={key}
                        value="N"
                        className="text-[#03a94d] focus:ring-[#03a94d]/30 cursor-pointer"
                        checked={certs[key] === "N"}
                        onChange={() => handleCertChange(key, "N")}
                        required
                      />
                      미취득/미이행 (N)
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-5 pt-4">
              <label className="text-sm font-bold text-gray-600 block mb-1">
                글로벌 인증 증빙서류 업로드 *
              </label>
              <p className="text-xs text-gray-400 mb-3 leading-normal font-medium">
                보유하신 글로벌 인증(환경, 품질, 안전, 분쟁광물 등)의 증빙서류 파일들을 업로드해 주십시오. (다중 선택 가능)
              </p>
              <div className="border border-gray-200 rounded-lg p-2 bg-white flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-md font-bold text-gray-700 transition shrink-0 cursor-pointer"
                  onClick={() => document.getElementById("cert-file-input").click()}
                >
                  파일 선택
                </button>
                <span className="text-xs text-gray-500">선택된 파일 {certFileNames.length}개</span>
                <input
                  id="cert-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleCertFiles}
                />
              </div>
              {certFileNames.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold text-gray-600">선택된 증빙서류 목록:</p>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                    {certFileNames.map((name, i) => (
                      <div
                        key={i}
                        className="text-xs text-gray-500 bg-slate-50 p-2 rounded-lg border border-gray-100 flex items-center justify-between"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => setCertFileNames((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-750 font-bold ml-2 cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 카드 3: 자가진단 및 증빙 자료 제출 */}
        <Card className="p-6">
          <CardHeader className="border-b border-gray-300 pb-3 mb-4">
            <CardTitle className="text-sm font-bold text-[#03a94d]">자가진단 및 증빙 자료 제출</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-gray-500 leading-normal font-medium">
              공급망 내 ESG 규제 리스크 방지를 위해 협력사의 자가진단 및 증빙자료 제출을 필수로 지정하고
              있습니다. 양식을 다운로드하여 작성 후 업로드해주십시오.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#03a94d]">{loginData?.tier}차 협력사용 자가진단 파일.xlsx</p>
                <p className="text-[11px] text-gray-400 font-medium">Excel 양식 파일</p>
              </div>
              <button
                type="button"
                className="text-xs px-3.5 py-2 border border-gray-250 bg-white hover:bg-[#03a94d] hover:text-white rounded-lg font-bold text-gray-700 transition cursor-pointer"
                onClick={() => handleDownloadSelfAssess()}
              >
                양식 다운로드
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-600 block mb-1">
                자가진단 완료 서류 업로드 *
              </label>
              <div className="border border-gray-200 rounded-lg p-2 bg-white flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-md font-bold text-gray-700 transition shrink-0 cursor-pointer"
                  onClick={() => document.getElementById("self-assess-file-input").click()}
                >
                  파일 선택
                </button>
                <span className="text-xs text-gray-500">
                  {selfAssessFileName || "선택된 파일 없음"}
                </span>
                <input
                  id="self-assess-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleSelfAssessFile}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-600 block mb-1">
                증빙자료 업로드 (다중 선택 가능) *
              </label>
              <div className="border border-gray-200 rounded-lg p-2 bg-white flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-md font-bold text-gray-700 transition shrink-0 cursor-pointer"
                  onClick={() => document.getElementById("evidence-file-input").click()}
                >
                  파일 선택
                </button>
                <span className="text-xs text-gray-500">선택된 파일 {evidenceFileNames.length}개</span>
                <input
                  id="evidence-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleEvidenceFiles}
                />
              </div>
              {evidenceFileNames.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold text-gray-600">선택된 증빙서류 목록:</p>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                    {evidenceFileNames.map((name, i) => (
                      <div
                        key={i}
                        className="text-xs text-gray-500 bg-slate-50 p-2 rounded-lg border border-gray-100 flex items-center justify-between"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => setEvidenceFileNames((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-755 font-bold ml-2 cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 카드 4: 협력사 행동강령 준수 서약 및 동의 */}
        <Card className="p-6">
          <CardHeader className="border-b border-gray-300 pb-3 mb-4">
            <CardTitle className="text-sm font-bold text-[#03a94d]">협력사 행동강령 준수 서약 및 동의</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-gray-500 leading-normal font-medium">
              공급망 내 ESG 규제 리스크 방지를 위해 협력사의 행동강령 서약 제출을 필수로 지정하고
              있습니다. 양식을 다운로드하여 날인 후 업로드해주십시오.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#03a94d]">현대모비스 협력사 행동강령 양식</p>
                <p className="text-[11px] text-gray-400 font-medium">CoC_Agreement_Form.pdf (1.2MB)</p>
              </div>
              <button
                type="button"
                className="text-xs px-3.5 py-2 border border-gray-250 bg-white hover:bg-[#03a94d] hover:text-white rounded-lg font-bold text-gray-700 transition cursor-pointer"
                onClick={() => handleDownloadCoC()}
              >
                양식 다운로드
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-600 block mb-1">
                행동강령 서약서 파일 업로드 *
              </label>
              <div className="border border-gray-200 rounded-lg p-2 bg-white flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-md font-bold text-gray-700 transition shrink-0 cursor-pointer"
                  onClick={() => document.getElementById("coc-file-input").click()}
                >
                  파일 선택
                </button>
                <span className="text-xs text-gray-500">{cocFileName || "선택된 파일 없음"}</span>
                <input
                  id="coc-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleCocFile}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 취소/저장 버튼 */}
        <div className="flex gap-2">
          <button
            type="button"
            id="btn-cancel-form-bottom"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#03a94d] hover:bg-[#02823b] text-white font-bold text-sm rounded-lg transition shadow-md cursor-pointer"
          >
            저장 및 제출하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
