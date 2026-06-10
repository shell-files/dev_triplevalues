import React, { useState, useEffect } from "react";

const poMappingData = {
  "PO-2026-0089": {
    company: "노벨리스코리아(주)",
    material: "알루미늄 코일"
  },
  "PO-2026-0102": {
    company: "(주)케이알엠",
    material: "P1020 잉곳"
  },
  "PO-2026-0115": {
    company: "삼우강업",
    material: "Mn 정광"
  }
};

const SPEC_ITEMS = {
  "spec-width": "폭(mm)",
  "spec-length": "길이(mm)",
  "spec-diameter": "지름(mm)",
  "spec-weight": "중량(kg)",
  "spec-origin": "원산지",
  "spec-components": "구성요소"
};

const SupplyChainMapMaterialRequest = ({ onBack = () => { } }) => {
  const [product, setProduct] = useState("열차폐판");
  const [selectedPO, setSelectedPO] = useState("PO-2026-0089");
  const [requestType, setRequestType] = useState("NEW");
  const [activeSpecs, setActiveSpecs] = useState({});
  const [dueDate, setDueDate] = useState("");
  const [requestContent, setRequestContent] = useState("");

  // requestType에 따른 조건부 Lock 로직 및 클린업
  useEffect(() => {
    if (requestType === "NEW") {
      setActiveSpecs({ ...SPEC_ITEMS });
    } else {
      setActiveSpecs({});
    }
  }, [requestType]);

  // 스펙 토글 핸들러 (독립된 캡슐화 함수)
  const toggleSpec = (id, name) => {
    if (requestType === "NEW") return;

    setActiveSpecs((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id];
      } else {
        updated[id] = name;
      }
      return updated;
    });
  };

  // 배지 개별 삭제 핸들러 (독립된 캡슐화 함수)
  const removeSpec = (id) => {
    if (requestType === "NEW") return;
    setActiveSpecs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // 요청 제출 핸들러
  const handleSubmit = () => {
    const keys = Object.keys(activeSpecs);
    if (keys.length === 0) {
      alert("최소 1개 이상의 요청 항목을 선택해야 합니다.");
      return;
    }

    if (!dueDate) {
      alert("제출 기한을 설정해주세요.");
      return;
    }

    alert("원자재 요청이 성공적으로 전송되었습니다.");
    onBack();
  };

  const currentPOData = poMappingData[selectedPO] || { company: "", material: "" };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col">
      {/* 상단 정보 헤딩 및 목록 이동 인터페이스 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">원자재 요청</h2>
          <p className="text-sm text-gray-400 mt-0.5">선택된 제품에 대한 원자재 사양 검토 및 제출 요청을 발송합니다.</p>
        </div>

        <div>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-700 transition cursor-pointer"
            onClick={onBack}
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      </div>

      {/* 메인 입력 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 flex-1 overflow-y-auto">
        {/* 요청 대상 및 매핑 패널 */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#03a94d] pb-2 border-b border-gray-100">요청 대상 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-600">대상 제품 선택</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 text-sm px-4 py-3 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold transition-colors cursor-pointer"
              >
                <option value="열차폐판">열차폐판</option>
                <option value="휠">휠</option>
                <option value="파이프">파이프</option>
                <option value="튜브">튜브</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-600">PO ID 선택</label>
              <select
                value={selectedPO}
                onChange={(e) => setSelectedPO(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 text-sm px-4 py-3 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold transition-colors cursor-pointer"
              >
                <option value="PO-2026-0089">PO-2026-0089</option>
                <option value="PO-2026-0102">PO-2026-0102</option>
                <option value="PO-2026-0115">PO-2026-0115</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-600">요청 분류</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 text-sm px-4 py-3 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold transition-colors cursor-pointer"
              >
                <option value="NEW">신규 등록 요청</option>
                <option value="REVIEW">재검토 요청</option>
              </select>
            </div>
          </div>

          {/* 자동 매핑 알림 패널 */}
          <p className="text-sm mt-2 font-bold text-gray-700">발주 정보</p>
          <div className="bg-slate-50 rounded-lg p-4 border border-gray-200/60 text-sm space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs md:text-sm text-gray-400">협력사명</span>
                <p className="text-sm md:text-base font-bold text-gray-900 mt-0.5">{currentPOData.company}</p>
              </div>
              <div>
                <span className="text-xs md:text-sm text-gray-400">원자재명</span>
                <p className="text-sm md:text-base font-bold text-gray-900 mt-0.5">{currentPOData.material}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 요청 항목 토글 인터페이스 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#03a94d] pb-2 border-b border-gray-100">요청 항목 선택</h3>
          <p className="text-xs md:text-sm text-gray-400">
            {requestType === "NEW"
              ? "* 신규 등록의 경우 요청 항목 선택이 불가합니다."
              : "* 원자재 정보 검토 요청을 위해 협력사에 요청할 세부 규격 제원 항목을 선택하세요."}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(SPEC_ITEMS).map(([id, name]) => {
              const isSelected = !!activeSpecs[id];
              let btnClass = "border text-sm py-3.5 px-4 rounded-lg font-semibold transition text-center ";

              if (requestType === "NEW") {
                btnClass += "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold cursor-default pointer-events-none opacity-80";
              } else {
                if (isSelected) {
                  btnClass += "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold cursor-pointer";
                } else {
                  btnClass += "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer";
                }
              }

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSpec(id, name)}
                  className={btnClass}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 공문 명세 및 자동 배지 출력 패널 */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#03a94d] pb-2 border-b border-gray-100">긴급 요청 정보</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-600">요청 항목</label>
            {/* 배지 출력 구역 */}
            <div className="h-16 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-slate-50/50 flex flex-wrap gap-2 items-center">
              {Object.keys(activeSpecs).length === 0 ? (
                <span className="text-sm text-gray-400 pl-1">위 항목에서 요청할 항목을 선택하면 자동으로 추가됩니다.</span>
              ) : (
                Object.entries(activeSpecs).map(([id, name]) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold"
                  >
                    <span>{name}</span>
                    {requestType === "NEW" ? (
                      <span className="text-emerald-500/50 ml-1 select-none pointer-events-none opacity-50">x</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeSpec(id)}
                        className="text-emerald-500 hover:text-emerald-800 ml-1 focus:outline-none cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-600">제출기한 설정</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 text-sm px-4 py-3 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-600">요청 상세 내용</label>
            <textarea
              rows="4"
              value={requestContent}
              onChange={(e) => setRequestContent(e.target.value)}
              placeholder="세부 내용을 입력해주세요."
              className="w-full bg-slate-50 border border-gray-200 text-sm px-4 py-3 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        {/* 최종 액션 컨트롤 바 */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3.5 rounded-lg transition-colors cursor-pointer text-center"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-[#03a94d] hover:bg-[#02823b] text-white font-bold text-sm py-3.5 rounded-lg transition-colors cursor-pointer text-center"
          >
            요청
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMapMaterialRequest;
