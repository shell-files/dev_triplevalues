import React, { useState } from "react";
import { Card } from "@components/Common/Card";

const CompanyInfo = () => {
  const [viewState, setViewState] = useState("welcome");

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-5 min-h-[calc(100vh-140px)] flex flex-col justify-center items-center font-['Pretendard']">
      {viewState === "welcome" && (
        <div id="company-welcome-section" className="w-full flex items-center justify-center py-12">
          <Card className="p-12 text-center max-w-3xl w-full mx-auto my-12 space-y-6">
            <div className="flex flex-col items-center justify-center">
              {/* 연한 그린 배경의 단정한 원형 레이어 */}
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

            {/* 안내 본문 단 */}
            <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
              ESG 플랫폼 시스템을 안전하게 이용하시기 위해<br className="hidden md:block" /> 최초 1회 기업 정보 등록 및 인증 증빙 서류 제출이 필요합니다.
            </p>

            {/* 핵심 액션 단추 배치 */}
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

      {viewState === "register" && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">신규 기업 정보 등록</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            (임시 플레이스홀더) 2단계 공정에서 구현될 기업 정보 등록 폼 영역입니다.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setViewState("welcome")}
              className="px-4 py-2 bg-gray-150 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition font-bold cursor-pointer"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}

      {viewState === "detail" && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">기업 정보 상세 조회</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            (임시 플레이스홀더) 3단계 공정에서 구현될 기업 정보 상세 명세 영역입니다.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setViewState("welcome")}
              className="px-4 py-2 bg-gray-150 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition font-bold cursor-pointer"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInfo;
