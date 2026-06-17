import React, { useState, useEffect } from "react";
import { Card } from "@components/Common/Card";

const CompanyInfo = () => {
  const [viewState, setViewState] = useState("welcome");
  const [savedData, setSavedData] = useState(null);

  // 기본 정보 및 ESG 성과 지표
  const [formData, setFormData] = useState({
    companyName: "",
    ceoName: "",
    bizNo: "",
    foundedDate: "",
    address: "",
    companySize: "",
    country: "",
    scope1: "",
    scope2: "",
    feocRatio: "",
    trir: "",
  });

  // 7대 글로벌 인증 준수 현황
  const [certs, setCerts] = useState({
    iso14001: "",
    iso45001: "",
    iatf16949: "",
    rba: "",
    rmap: "",
    cmrt: "",
    emat: "",
  });

  // 업로드된 모의 파일 이름들
  const [selfAssessFileName, setSelfAssessFileName] = useState("");
  const [cocFileName, setCocFileName] = useState("");
  const [certFileNames, setCertFileNames] = useState([]);
  const [evidenceFileNames, setEvidenceFileNames] = useState([]);

  // viewState가 register로 변경될 때 기존 저장 데이터가 있다면 복원
  useEffect(() => {
    if (viewState === "register") {
      if (savedData) {
        setFormData(savedData.formData);
        setCerts(savedData.certs);
        setSelfAssessFileName(savedData.selfAssessFileName);
        setCocFileName(savedData.cocFileName);
        setCertFileNames(savedData.certFileNames);
        setEvidenceFileNames(savedData.evidenceFileNames);
      } else {
        setFormData({
          companyName: "",
          ceoName: "",
          bizNo: "",
          foundedDate: "",
          address: "",
          companySize: "",
          country: "",
          scope1: "",
          scope2: "",
          feocRatio: "",
          trir: "",
        });
        setCerts({
          iso14001: "",
          iso45001: "",
          iatf16949: "",
          rba: "",
          rmap: "",
          cmrt: "",
          emat: "",
        });
        setSelfAssessFileName("");
        setCocFileName("");
        setCertFileNames([]);
        setEvidenceFileNames([]);
      }
    }
  }, [viewState]);

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

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.ceoName || !formData.bizNo || !formData.address) {
      alert("필수 입력값(*)을 기입해주세요.");
      return;
    }

    if (!selfAssessFileName || !cocFileName || certFileNames.length === 0 || evidenceFileNames.length === 0) {
      alert("자가진단서, 행동강령 서약서, 글로벌 인증 증빙서류는 필수 업로드 항목입니다.");
      return;
    }

    // 로컬 상위 상태 캐싱
    setSavedData({
      formData,
      certs,
      selfAssessFileName,
      cocFileName,
      certFileNames,
      evidenceFileNames,
    });

    setViewState("detail");
  };

  // 취소 처리
  const handleCancel = () => {
    setViewState("welcome");
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-5 min-h-[calc(100vh-140px)] flex flex-col justify-between items-center font-['Pretendard']">
      <div className="w-full flex-1">
        {/* 웰컴 화면 */}
        {viewState === "welcome" && (
          <div id="company-welcome-section" className="w-full flex items-center justify-center py-12">
            <Card className="p-12 text-center max-w-3xl w-full mx-auto my-12 space-y-6">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-[#03a94d] mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12m-6 0h6"
                    />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  ESG 공급망 플랫폼 협력사 포털 진입을 환영합니다
                </h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
                ESG 플랫폼 시스템을 안전하게 이용하시기 위해
                <br className="hidden md:block" /> 최초 1회 기업 정보 등록 및 인증 증빙 서류 제출이 필요합니다.
              </p>

              <div className="pt-2">
                <button
                  id="btn-register-company"
                  onClick={() => setViewState("register")}
                  className="px-6 py-3 text-white text-sm rounded-lg font-bold bg-[#03a94d] hover:bg-[#02823b] transition shadow-md inline-block cursor-pointer"
                >
                  기업 정보 등록하기
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* 등록 및 수정 폼 화면 */}
        {viewState === "register" && (
          <div id="company-form-section" className="w-full space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">신규 기업 정보 등록</h2>
              <button
                id="btn-cancel-form"
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition font-bold cursor-pointer"
              >
                취소
              </button>
            </div>

            <form id="frm-company-info" className="space-y-6" onSubmit={handleSubmit}>
              {/* 1. 기본 정보 및 ESG 성과 지표 카드 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                  기본 정보 및 ESG 성과 지표 입력
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 좌측: 기본 기업 정보 */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#03a94d] uppercase tracking-wider">기본 기업 정보</h4>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">기업명 *</label>
                      <input
                        type="text"
                        placeholder="예: (주)노벨리스코리아"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
                        value={formData.bizNo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bizNo: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">설립일 *</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 text-gray-700"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
                        value={formData.address}
                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">기업 규모 *</label>
                        <select
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 bg-white text-gray-750"
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
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
                          value={formData.country}
                          onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* 우측: 핵심 ESG 지표 */}
                  <div className="space-y-4 md:border-l md:pl-5 md:border-gray-100">
                    <h4 class="text-xs font-extrabold text-[#03a94d] uppercase tracking-wider">핵심 ESG 지표</h4>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">
                        Scope 1 배출량 (tCO2e) *
                      </label>
                      <input
                        type="number"
                        placeholder="예: 82000"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30"
                        value={formData.trir}
                        onChange={(e) => setFormData((prev) => ({ ...prev, trir: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 글로벌 인증 준수 현황 카드 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                  글로벌 인증 준수 현황
                </h3>
                <div className="space-y-4">
                  {Object.keys(certs).map((key) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <span className="text-xs font-bold text-gray-700">
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
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
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
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
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
                  <label className="text-xs font-bold text-gray-600 block mb-1">
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
              </div>

              {/* 3. 자가진단 및 증빙 자료 제출 카드 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-150 pb-3">
                  자가진단 및 증빙 자료 제출
                </h3>
                <p className="text-xs text-gray-500 leading-normal font-medium">
                  공급망 내 ESG 규제 리스크 방지를 위해 협력사의 자가진단 및 증빙자료 제출을 필수로 지정하고
                  있습니다. 양식을 다운로드하여 작성 후 업로드해주십시오.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800">1차 협력사용 자가진단 파일.xlsx</p>
                    <p className="text-[11px] text-gray-400 font-medium">Excel 양식 파일</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs px-3.5 py-2 border border-gray-250 bg-white hover:bg-gray-100 rounded-lg font-bold text-gray-700 transition cursor-pointer"
                    onClick={() => alert("1차 협력사용 자가진단 파일.xlsx 양식 파일 다운로드가 완료되었습니다.")}
                  >
                    양식 다운로드
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 block mb-1">
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
                  <label className="text-xs font-bold text-gray-600 block mb-1">
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
              </div>

              {/* 4. 협력사 행동강령 준수 서약 및 동의 카드 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-150 pb-3">
                  협력사 행동강령 준수 서약 및 동의
                </h3>
                <p className="text-xs text-gray-500 leading-normal font-medium">
                  공급망 내 ESG 규제 리스크 방지를 위해 협력사의 행동강령 서약 제출을 필수로 지정하고
                  있습니다. 양식을 다운로드하여 날인 후 업로드해주십시오.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800">현대모비스 협력사 행동강령 양식</p>
                    <p className="text-[11px] text-gray-400 font-medium">CoC_Agreement_Form.pdf (1.2MB)</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs px-3.5 py-2 border border-gray-250 bg-white hover:bg-gray-100 rounded-lg font-bold text-gray-700 transition cursor-pointer"
                    onClick={() => alert("행동강령 서약서 양식 파일 다운로드가 완료되었습니다.")}
                  >
                    양식 다운로드
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 block mb-1">
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
              </div>

              {/* 하단 취소/저장 버튼 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-cancel-form-bottom"
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-md bg-[#03a94d] cursor-pointer"
                >
                  저장 및 제출하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 상세 조회 뷰 화면 */}
        {viewState === "detail" && (
          <div id="company-detail-section" className="w-full space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">기업 정보 상세 조회</h2>
              <div className="flex gap-2">
                <button
                  id="btn-edit-company"
                  onClick={() => setViewState("register")}
                  className="px-4 py-2 text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-sm bg-[#03a94d] cursor-pointer"
                >
                  정보 수정하기
                </button>
                <button
                  onClick={() => setViewState("welcome")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition font-bold cursor-pointer"
                >
                  웰컴 화면으로
                </button>
              </div>
            </div>

            {savedData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 기본 정보 */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-[#03a94d] border-b border-gray-100 pb-2">
                    기본 기업 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">기업명</span>
                      <span className="font-bold text-gray-800">{savedData.formData.companyName}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">대표자명</span>
                      <span className="font-bold text-gray-800">{savedData.formData.ceoName}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">사업자등록번호</span>
                      <span className="font-bold text-gray-800">{savedData.formData.bizNo}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">설립일</span>
                      <span className="font-bold text-gray-800">{savedData.formData.foundedDate || "-"}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between col-span-2">
                      <span className="text-gray-400 block mb-1">소재지</span>
                      <span className="font-bold text-gray-800">{savedData.formData.address}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">기업 규모</span>
                      <span className="font-bold text-gray-800">{savedData.formData.companySize || "-"}</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">소재 국가</span>
                      <span className="font-bold text-gray-800">{savedData.formData.country || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* ESG 지표 */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-[#03a94d] border-b border-gray-100 pb-2">
                    핵심 ESG 지표
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">Scope 1 배출량 (tCO2e)</span>
                      <span className="font-bold text-gray-800">
                        {savedData.formData.scope1
                          ? Number(savedData.formData.scope1).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">Scope 2 배출량 (tCO2e)</span>
                      <span className="font-bold text-gray-800">
                        {savedData.formData.scope2
                          ? Number(savedData.formData.scope2).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">FEOC 원료 비중 (%)</span>
                      <span className="font-bold text-gray-800">{savedData.formData.feocRatio || "-"} %</span>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3 border border-gray-100 flex flex-col justify-between">
                      <span className="text-gray-400 block mb-1">TRIR 산업안전율</span>
                      <span className="font-bold text-gray-800">{savedData.formData.trir || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* 글로벌 인증 */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-[#03a94d] border-b border-gray-100 pb-2">
                    글로벌 인증 준수 현황
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
                    {Object.entries(savedData.certs).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 bg-slate-50/50 border border-gray-100 rounded-xl flex flex-col items-center gap-1"
                      >
                        <span className="font-bold text-gray-750">
                          {key === "iso14001"
                            ? "ISO 14001"
                            : key === "iso45001"
                              ? "ISO 45001"
                              : key === "iatf16949"
                                ? "IATF 16949"
                                : key.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${val === "Y"
                            ? "bg-[#03a94d]/10 text-[#03a94d] border-[#03a94d]/20"
                            : "bg-gray-100 text-gray-400 border-gray-250"
                            }`}
                        >
                          {val === "Y" ? "준수 (Y)" : "미준수 (N)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 제출 서류 */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-[#03a94d] border-b border-gray-100 pb-2">
                    제출 서류 목록
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/60 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-850 truncate">자가진단 완료 서류</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {savedData.selfAssessFileName}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/60 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-855 truncate">행동강령 서약서</p>
                        <p className="text-[10px] text-gray-400 font-medium">{savedData.cocFileName}</p>
                      </div>
                    </div>
                    {savedData.certFileNames.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/60 space-y-1.5">
                        <p className="font-bold text-gray-860">글로벌 인증 증빙서류 목록</p>
                        <div className="pl-2 space-y-1 text-gray-500">
                          {savedData.certFileNames.map((name, i) => (
                            <p key={i}>• {name}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {savedData.evidenceFileNames.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/60 space-y-1.5">
                        <p className="font-bold text-gray-865">기타 증빙자료 목록</p>
                        <div className="pl-2 space-y-1 text-gray-500">
                          {savedData.evidenceFileNames.map((name, i) => (
                            <p key={i}>• {name}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
                <p className="text-sm text-gray-500">
                  저장된 기업 정보 데이터가 없습니다. 먼저 등록을 완료해 주세요.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInfo;
