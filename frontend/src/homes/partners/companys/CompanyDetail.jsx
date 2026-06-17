import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/Common/Card";

const CompanyDetail = ({
  savedData,
  factories,
  onAddFactory,
  onDeleteFactory,
  onUpdateFactory,
  onNavigateToRegister,
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const [showAddForm, setShowAddForm] = useState(false);

  // 현재 인라인 수정 중인 공장의 ID
  const [editingFactoryId, setEditingFactoryId] = useState(null);

  // 수정 중인 공장 임시 데이터 상태
  const [editFactoryData, setEditFactoryData] = useState({
    factory_name: "",
    address: "",
    operation_status: "가동",
    utilization_rate: "",
    scope1_emissions: "",
    scope2_emissions: "",
    feoc_raw_material_ratio: "",
    trir_safety_rate: "",
  });

  // 새 공장 입력을 위한 로컬 상태
  const [newFactory, setNewFactory] = useState({
    factory_name: "",
    address: "",
    operation_status: "가동",
    utilization_rate: "",
    scope1_emissions: "",
    scope2_emissions: "",
    feoc_raw_material_ratio: "",
    trir_safety_rate: "",
  });

  const formatNum = (val) => {
    if (val === undefined || val === null || val === "") return "-";
    return Number(val).toLocaleString();
  };

  // 가동 상태에 따른 뱃지 렌더링 헬퍼
  const renderOperationStatusBadge = (status) => {
    const s = status || "가동";
    if (s === "가동") {
      return (
        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[12px]">
          가동
        </span>
      );
    }
    if (s === "정지") {
      return (
        <span className="bg-amber-50 text-amber-600 border border-amber-200 font-bold px-2 py-0.5 rounded text-[11px]">
          정지
        </span>
      );
    }
    if (s === "폐쇄") {
      return (
        <span className="bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded text-[11px]">
          폐쇄
        </span>
      );
    }
    if (s === "정비") {
      return (
        <span className="bg-blue-50 text-blue-600 border border-blue-200 font-bold px-2 py-0.5 rounded text-[11px]">
          정비
        </span>
      );
    }
    return (
      <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded text-[11px]">
        {s}
      </span>
    );
  };

  const renderCertBadge = (val) => {
    const isY = val === "Y";
    return (
      <span
        className={`inline-block text-[12px] px-2 py-0.5 rounded font-bold border text-center ${isY
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-600 border-red-100"
          }`}
      >
        {isY ? "Y (준수)" : "N (미준수)"}
      </span>
    );
  };

  // 모의 파일 다운로드 핸들러
  const handleMockDownload = (fileName) => {
    alert(fileName + " 파일 다운로드가 완료되었습니다.");
  };

  // 서류 목록 렌더링 헬퍼
  const renderFileListSection = (title, fileName) => {
    return (
      <div className="bg-slate-50/60 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gray-100 text-gray-400 font-bold rounded-lg flex items-center justify-center font-mono">
            01
          </div>
          <span className="text-sm font-bold text-gray-800 truncate">
            {fileName || "제출된 파일이 없습니다."}
          </span>
        </div>
        {fileName && (
          <button
            type="button"
            onClick={() => handleMockDownload(fileName)}
            className="text-xs p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition shrink-0 flex items-center justify-center cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const renderMultiFileListSection = (title, fileNames) => {
    if (!fileNames || fileNames.length === 0) {
      return (
        <div className="bg-slate-50/60 border border-gray-100 p-3 rounded-xl flex items-center gap-3 text-xs text-gray-400">
          제출된 파일이 없습니다.
        </div>
      );
    }
    const hasScroll = fileNames.length >= 7;
    return (
      <div className={`space-y-2 ${hasScroll ? "max-h-[360px] overflow-y-auto pr-1" : ""}`}>
        {fileNames.map((name, idx) => (
          <div
            key={idx}
            className="bg-slate-50/60 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-gray-100 text-gray-400 font-bold rounded-lg flex items-center justify-center font-mono">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <span className="text-sm font-bold text-gray-800 truncate">{name}</span>
            </div>
            <button
              type="button"
              onClick={() => handleMockDownload(name)}
              className="text-xs p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition shrink-0 flex items-center justify-center cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 신규 공장 등록 제출 핸들러
  const handleFactorySubmit = (e) => {
    e.preventDefault();

    if (!newFactory.factory_name || !newFactory.address || !newFactory.utilization_rate) {
      alert("공장명, 소재지, 이용 비율은 필수 입력값입니다.");
      return;
    }

    onAddFactory({
      ...newFactory,
      id: Date.now(),
      utilization_rate: Number(newFactory.utilization_rate),
      scope1_emissions: newFactory.scope1_emissions ? Number(newFactory.scope1_emissions) : "",
      scope2_emissions: newFactory.scope2_emissions ? Number(newFactory.scope2_emissions) : "",
      feoc_raw_material_ratio: newFactory.feoc_raw_material_ratio
        ? Number(newFactory.feoc_raw_material_ratio)
        : "",
      trir_safety_rate: newFactory.trir_safety_rate ? Number(newFactory.trir_safety_rate) : "",
    });

    // 폼 리셋 및 닫기
    setNewFactory({
      factory_name: "",
      address: "",
      operation_status: "가동",
      utilization_rate: "",
      scope1_emissions: "",
      scope2_emissions: "",
      feoc_raw_material_ratio: "",
      trir_safety_rate: "",
    });
    setShowAddForm(false);
  };

  // 공장 삭제 핸들러 호출
  const handleDeleteClick = (id, name) => {
    if (confirm("정말로 " + name + " 공장을 삭제하시겠습니까?")) {
      onDeleteFactory(id);
      // 수정 모드 상태에서 삭제되는 경우 수정 모드 해제
      if (editingFactoryId === id) {
        setEditingFactoryId(null);
      }
    }
  };

  // 공장 수정 모드 개시
  const startEdit = (factory) => {
    setEditingFactoryId(factory.id);
    setEditFactoryData({
      ...factory,
      utilization_rate: factory.utilization_rate ?? "",
      scope1_emissions: factory.scope1_emissions ?? "",
      scope2_emissions: factory.scope2_emissions ?? "",
      feoc_raw_material_ratio: factory.feoc_raw_material_ratio ?? "",
      trir_safety_rate: factory.trir_safety_rate ?? "",
    });
  };

  // 공장 수정 모드 취소
  const cancelEdit = () => {
    setEditingFactoryId(null);
  };

  // 공장 수정 완료 제출
  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (!editFactoryData.factory_name || !editFactoryData.address || !editFactoryData.utilization_rate) {
      alert("공장명, 소재지, 이용 비율은 필수 입력값입니다.");
      return;
    }

    onUpdateFactory({
      ...editFactoryData,
      utilization_rate: Number(editFactoryData.utilization_rate),
      scope1_emissions: editFactoryData.scope1_emissions ? Number(editFactoryData.scope1_emissions) : "",
      scope2_emissions: editFactoryData.scope2_emissions ? Number(editFactoryData.scope2_emissions) : "",
      feoc_raw_material_ratio: editFactoryData.feoc_raw_material_ratio
        ? Number(editFactoryData.feoc_raw_material_ratio)
        : "",
      trir_safety_rate: editFactoryData.trir_safety_rate ? Number(editFactoryData.trir_safety_rate) : "",
    });

    setEditingFactoryId(null);
  };

  return (
    <div id="company-detail-section" className="w-full space-y-6 flex-1">
      {/* 페이지 헤더 배너 */}
      <div>
        <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">기업 정보 상세</h2>
        <p className="text-sm text-gray-400 mt-0.5">플랫폼 연동을 위한 협력사 기본 정보 및 글로벌 인증 자산 마스터 관리</p>
      </div>

      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between border-l-10 border-emerald-500 pl-5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {savedData?.formData?.companyName || "기등록 협력사 정보"}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            대표자명: {savedData?.formData?.ceoName || "-"} | 사업자등록번호:{" "}
            {savedData?.formData?.bizNo || "-"}
          </p>
        </div>
        <button
          id="btn-edit-company"
          onClick={onNavigateToRegister}
          className="px-4 py-2 bg-[#03a94d] hover:bg-[#02823b] text-white font-bold text-sm rounded-lg transition shadow-sm cursor-pointer"
        >
          정보 수정하기
        </button>
      </div>

      {/* 3대 서브 탭 내비게이션 */}
      <div className="flex border-b border-gray-200 text-base overflow-x-auto select-none">
        {[
          ["info", "기업정보"],
          ["files", "제출서류"],
          ["factories", "공장정보"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-6 py-3 font-bold border-b-2 tracking-tight whitespace-nowrap cursor-pointer transition-colors ${activeTab === key
                ? "border-[#03a94d] text-[#03a94d]"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 영역 */}
      <div className="space-y-6">
        {/* 1. 기업정보 탭 */}
        {activeTab === "info" && (
          <div className="space-y-6 animate-fade-in">
            {/* 기본 협력사 정보 */}
            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-100 pb-2 mb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">기본 기업 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    ["기업명", savedData?.formData?.companyName],
                    ["대표자명", savedData?.formData?.ceoName],
                    ["사업자등록번호", savedData?.formData?.bizNo],
                    ["설립일", savedData?.formData?.foundedDate],
                    ["소재지", savedData?.formData?.address],
                    ["기업 규모", savedData?.formData?.companySize],
                    ["소재 국가", savedData?.formData?.country],
                  ].map(([label, val], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                    >
                      <span className="text-gray-400 font-semibold">{label}</span>
                      <span className="font-bold text-gray-800">{val || "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ESG 주요 지표 데이터 */}
            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-100 pb-2 mb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">ESG 주요 지표 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    ["Scope 1 (tCO2e)", formatNum(savedData?.formData?.scope1)],
                    ["Scope 2 (tCO2e)", formatNum(savedData?.formData?.scope2)],
                    [
                      "FEOC 원료 비중",
                      savedData?.formData?.feocRatio ? `${savedData.formData.feocRatio}%` : "-",
                    ],
                    ["TRIR 산업안전율", savedData?.formData?.trir],
                  ].map(([label, val], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                    >
                      <span className="text-gray-400 font-semibold">{label}</span>
                      <span className="font-bold text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 글로벌 인증 현황 */}
            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-100 pb-2 mb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">
                  글로벌 인증 및 이니셔티브 준수 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    ["ISO 14001 (환경경영인증)", savedData?.certs?.iso14001],
                    ["ISO 45001 (안전보건인증)", savedData?.certs?.iso45001],
                    ["IATF 16949 (품질경영인증)", savedData?.certs?.iatf16949],
                    ["RBA (책임 비즈니스 인증)", savedData?.certs?.rba],
                    ["RMAP (책임 광물 보증 인증)", savedData?.certs?.rmap],
                    ["CMRT (분쟁광물 보고 인증)", savedData?.certs?.cmrt],
                    ["EMAT (배터리·광물 추적 보고)", savedData?.certs?.emat],
                  ].map(([label, val], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl"
                    >
                      <span className="text-gray-400 font-semibold">{label}</span>
                      {renderCertBadge(val)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. 제출서류 탭 */}
        {activeTab === "files" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-50 pb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">자가진단 완료 문서</CardTitle>
              </CardHeader>
              <CardContent>
                {renderFileListSection("자가진단 완료 문서", savedData?.selfAssessFileName)}
              </CardContent>
            </Card>

            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-50 pb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">자가진단 증빙 자료</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMultiFileListSection("자가진단 증빙 자료", savedData?.evidenceFileNames)}
              </CardContent>
            </Card>

            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-50 pb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">글로벌 인증 증빙 자료</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMultiFileListSection("글로벌 인증 증빙 자료", savedData?.certFileNames)}
              </CardContent>
            </Card>

            <Card className="p-5 space-y-4">
              <CardHeader className="border-b border-gray-50 pb-2">
                <CardTitle className="text-sm font-bold text-[#03a94d]">행동강령 준수 서약서</CardTitle>
              </CardHeader>
              <CardContent>
                {renderFileListSection("행동강령 준수 서약서", savedData?.cocFileName)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. 공장정보 탭 */}
        {activeTab === "factories" && (
          <div className="space-y-6 animate-fade-in">
            {/* 가중합산 요약 보드 */}
            <Card className="p-6 bg-white">
              <div className="font-bold text-[#03a94d] text-base mb-2">
                ESG 가중합산 요약 (공장별 이용 비율 반영)
              </div>
              <div className="grid grid-cols-4 text-sm gap-4">
                {[
                  ["Scope 1", `${formatNum(savedData?.formData?.scope1)} tCO2e`],
                  ["Scope 2", `${formatNum(savedData?.formData?.scope2)} tCO2e`],
                  ["FEOC 비중", `${savedData?.formData?.feocRatio || 0}%`],
                  ["TRIR", savedData?.formData?.trir || 0],
                ].map(([label, val], i) => (
                  <div key={i}>
                    <div className="text-gray-400 font-semibold">{label}</div>
                    <div className="font-bold text-gray-800 mt-1">{val}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 공장 목록 조회 및 인라인 에디팅 토글 */}
            <Card className="p-6 bg-white space-y-6">
              <div>
                <div className="border-l-5 border-emerald-500 pl-2 pb-2 mb-4 font-bold text-gray-900 text-base">
                  공장 목록 ({factories.length}개)
                </div>
                <div className="space-y-4">
                  {factories.length > 0 ? (
                    factories.map((f, idx) => {
                      const isEditing = editingFactoryId === f.id;
                      if (isEditing) {
                        // 인라인 수정 폼 활성화 모드
                        return (
                          <div
                            key={f.id || idx}
                            className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 shadow-3xs"
                          >
                            <h4 className="text-sm font-bold text-gray-900">공장 정보 수정</h4>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    공장명 *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="예: 울산 제1공장"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.factory_name}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        factory_name: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    소재지 *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="예: 울산시 북구 산업로 100"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.address}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        address: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    가동 상태 *
                                  </label>
                                  <select
                                    className="w-full bg-white border border-gray-200 text-sm px-2 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 bg-white"
                                    value={editFactoryData.operation_status || "가동"}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        operation_status: e.target.value,
                                      }))
                                    }
                                    required
                                  >
                                    <option value="가동">가동</option>
                                    <option value="정지">정지</option>
                                    <option value="폐쇄">폐쇄</option>
                                    <option value="정비">정비</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    이용 비율 (%) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="예: 40"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.utilization_rate}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        utilization_rate: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    Scope 1 (tCO2e)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="예: 1200"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.scope1_emissions}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        scope1_emissions: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    Scope 2 (tCO2e)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="예: 800"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.scope2_emissions}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        scope2_emissions: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    FEOC (%)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder="예: 8.5"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.feoc_raw_material_ratio}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        feoc_raw_material_ratio: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-1">
                                <div>
                                  <label className="text-xs font-bold text-gray-600 block mb-1">
                                    TRIR
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="예: 0.12"
                                    className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                                    value={editFactoryData.trir_safety_rate}
                                    onChange={(e) =>
                                      setEditFactoryData((prev) => ({
                                        ...prev,
                                        trir_safety_rate: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-750 text-xs font-bold rounded-lg transition cursor-pointer"
                                >
                                  취소
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-[#03a94d] hover:bg-[#02823b] text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                                >
                                  수정 완료
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      }

                      // 일반 공장 카드 모드
                      return (
                        <div
                          key={f.id || idx}
                          className="border border-gray-200 bg-white rounded-xl p-4 space-y-3 shadow-3xs hover:border-gray-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col text-left items-start">
                              <div className="mb-1.5">
                                {renderOperationStatusBadge(f.operation_status)}
                              </div>
                              <span className="font-bold text-gray-900 text-sm">
                                {f.factory_name || `공장 ${idx + 1}`}
                              </span>
                              <span className="text-xs text-gray-400 mt-1">{f.address || "-"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1.5 ml-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(f)}
                                  className="text-xs font-bold text-[#03a94d] hover:text-[#02823b] transition cursor-pointer"
                                >
                                  수정
                                </button>
                                <span className="text-gray-200 select-none">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(f.id, f.factory_name)}
                                  className="text-xs font-bold text-red-500 hover:text-red-755 transition cursor-pointer"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 border border-gray-200 rounded-lg divide-x divide-gray-200 bg-white text-sm">
                            {[
                              ["이용 비율", `${f.utilization_rate || 0}%`],
                              ["Scope 1", `${formatNum(f.scope1_emissions)} tCO2e`],
                              ["Scope 2", `${formatNum(f.scope2_emissions)} tCO2e`],
                              ["FEOC", `${f.feoc_raw_material_ratio || 0}%`],
                              ["TRIR", f.trir_safety_rate || 0],
                            ].map(([label, val], i) => (
                              <div key={i} className="p-3 text-center">
                                <div className="text-gray-400 font-semibold mb-1">{label}</div>
                                <div className="font-bold text-gray-800">{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-6">
                      등록된 공장 정보가 없습니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 새 공장 인라인 등록 버튼 및 폼 */}
              <div className="pt-2 border-t border-gray-100">
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(true);
                      setNewFactory({
                        factory_name: "",
                        address: "",
                        operation_status: "가동",
                        utilization_rate: "",
                        scope1_emissions: "",
                        scope2_emissions: "",
                        feoc_raw_material_ratio: "",
                        trir_safety_rate: "",
                      });
                    }}
                    className="w-full py-3 border border-dashed border-[#03a94d] hover:bg-emerald-50/30 text-[#03a94d] text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>+ 새 공장 등록하기</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">새 공장 추가 등록</h4>
                    <form onSubmit={handleFactorySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            공장명 *
                          </label>
                          <input
                            type="text"
                            placeholder="예: 울산 제1공장"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.factory_name}
                            onChange={(e) =>
                              setNewFactory((prev) => ({ ...prev, factory_name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            소재지 *
                          </label>
                          <input
                            type="text"
                            placeholder="예: 울산시 북구 산업로 100"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.address}
                            onChange={(e) =>
                              setNewFactory((prev) => ({ ...prev, address: e.target.value }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            가동 상태 *
                          </label>
                          <select
                            className="w-full bg-white border border-gray-200 text-sm px-2 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 bg-white"
                            value={newFactory.operation_status}
                            onChange={(e) =>
                              setNewFactory((prev) => ({ ...prev, operation_status: e.target.value }))
                            }
                            required
                          >
                            <option value="가동">가동</option>
                            <option value="정지">정지</option>
                            <option value="폐쇄">폐쇄</option>
                            <option value="정비">정비</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            이용 비율 (%) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="예: 40"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.utilization_rate}
                            onChange={(e) =>
                              setNewFactory((prev) => ({
                                ...prev,
                                utilization_rate: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            Scope 1 (tCO2e)
                          </label>
                          <input
                            type="number"
                            placeholder="예: 1200"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.scope1_emissions}
                            onChange={(e) =>
                              setNewFactory((prev) => ({
                                ...prev,
                                scope1_emissions: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            Scope 2 (tCO2e)
                          </label>
                          <input
                            type="number"
                            placeholder="예: 800"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.scope2_emissions}
                            onChange={(e) =>
                              setNewFactory((prev) => ({
                                ...prev,
                                scope2_emissions: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            FEOC (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="예: 8.5"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.feoc_raw_material_ratio}
                            onChange={(e) =>
                              setNewFactory((prev) => ({
                                ...prev,
                                feoc_raw_material_ratio: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">
                            TRIR
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="예: 0.12"
                            className="w-full bg-white border border-gray-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 transition"
                            value={newFactory.trir_safety_rate}
                            onChange={(e) =>
                              setNewFactory((prev) => ({
                                ...prev,
                                trir_safety_rate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewFactory({
                              factory_name: "",
                              address: "",
                              operation_status: "가동",
                              utilization_rate: "",
                              scope1_emissions: "",
                              scope2_emissions: "",
                              feoc_raw_material_ratio: "",
                              trir_safety_rate: "",
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-750 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#03a94d] hover:bg-[#02823b] text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                        >
                          공장 추가
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetail;
