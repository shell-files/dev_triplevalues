import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";
import CompanyWelcome from "./CompanyWelcome";
import CompanyForm from "./CompanyForm";

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

  // 폼 제출 완료 처리 (저장 및 제출)
  const handleSave = () => {
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

  // 자식 폼 컴포넌트에게 내릴 파일 상태 팩
  const fileStates = {
    selfAssessFileName,
    setSelfAssessFileName,
    cocFileName,
    setCocFileName,
    certFileNames,
    setCertFileNames,
    evidenceFileNames,
    setEvidenceFileNames,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard'] text-gray-700">
      {/* 1. 페이지 공통 헤더 배너 (어드민 UI 1:1 대칭화) */}
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">기업 정보 관리</h2>
        <p className="text-sm text-gray-400 mt-0.5">플랫폼 연동을 위한 협력사 기본 정보 및 글로벌 인증 자산 마스터 관리</p>
      </div>

      {/* 2. 웰컴 화면 분기 */}
      {viewState === "welcome" && (
        <CompanyWelcome onNavigateToRegister={() => setViewState("register")} />
      )}

      {/* 3. 등록 및 수정 폼 화면 분기 */}
      {viewState === "register" && (
        <CompanyForm
          formData={formData}
          setFormData={setFormData}
          certs={certs}
          setCerts={setCerts}
          fileStates={fileStates}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* 4. 상세 조회 뷰 화면 */}
      {viewState === "detail" && (
        <div id="company-detail-section" className="w-full space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">기업 정보 상세 조회</h3>
            <div className="flex gap-2">
              <button
                id="btn-edit-company"
                onClick={() => setViewState("register")}
                className="px-4 py-2 bg-[#03a94d] hover:bg-[#02823b] text-white font-bold text-sm rounded-lg transition shadow-sm cursor-pointer"
              >
                정보 수정하기
              </button>
              <button
                onClick={() => setViewState("welcome")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition cursor-pointer"
              >
                웰컴 화면으로
              </button>
            </div>
          </div>

          {savedData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <Card className="p-6">
                <CardHeader className="border-b border-gray-100 pb-2 mb-4">
                  <CardTitle className="text-sm text-[#03a94d]">기본 기업 정보</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* ESG 지표 */}
              <Card className="p-6">
                <CardHeader className="border-b border-gray-100 pb-2 mb-4">
                  <CardTitle className="text-sm text-[#03a94d]">핵심 ESG 지표</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* 글로벌 인증 */}
              <Card className="p-6 md:col-span-2">
                <CardHeader className="border-b border-gray-100 pb-2 mb-4">
                  <CardTitle className="text-sm text-[#03a94d]">글로벌 인증 준수 현황</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* 제출 서류 */}
              <Card className="p-6 md:col-span-2">
                <CardHeader className="border-b border-gray-100 pb-2 mb-4">
                  <CardTitle className="text-sm text-[#03a94d]">제출 서류 목록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/60 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-855 truncate">자가진단 완료 서류</p>
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
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-500">
                저장된 기업 정보 데이터가 없습니다. 먼저 등록을 완료해 주세요.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyInfo;
