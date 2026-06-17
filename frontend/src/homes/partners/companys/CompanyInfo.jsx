import React, { useState, useEffect } from "react";
import CompanyWelcome from "./CompanyWelcome";
import CompanyForm from "./CompanyForm";
import CompanyDetail from "./CompanyDetail";

const CompanyInfo = () => {
  const [viewState, setViewState] = useState("welcome");
  const [savedData, setSavedData] = useState(null);

  // 공장 목록 상태 (기본 샘플 레코드 1개 포함 및 가동상태 명시)
  const [factories, setFactories] = useState([
    {
      id: 1,
      factory_name: "울산 제1공장",
      address: "울산광역시 북구 산업로 100",
      operation_status: "가동",
      utilization_rate: 60,
      scope1_emissions: 52000,
      scope2_emissions: 28000,
      feoc_raw_material_ratio: 8.5,
      trir_safety_rate: 0.12,
    },
  ]);

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

  // 신규 공장 추가 핸들러
  const handleAddFactory = (newFactory) => {
    setFactories((prev) => [...prev, newFactory]);
  };

  // 공장 삭제 핸들러
  const handleDeleteFactory = (id) => {
    setFactories((prev) => prev.filter((f) => f.id !== id));
  };

  // 공장 수정 핸들러
  const handleUpdateFactory = (updatedFactory) => {
    setFactories((prev) =>
      prev.map((f) => (f.id === updatedFactory.id ? updatedFactory : f))
    );
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

      {/* 4. 상세 조회 뷰 화면 분기 */}
      {viewState === "detail" && (
        <CompanyDetail
          savedData={savedData}
          factories={factories}
          onAddFactory={handleAddFactory}
          onDeleteFactory={handleDeleteFactory}
          onUpdateFactory={handleUpdateFactory}
          onNavigateToRegister={() => setViewState("register")}
        />
      )}
    </div>
  );
};

export default CompanyInfo;
