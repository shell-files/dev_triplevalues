import React, { useState, useEffect } from "react";
import { GET } from "@utils/Network";


const SupplyChainMapDetail = ({ productId, onBack = () => { } }) => {
  const [selectedVersion, setSelectedVersion] = useState("v2.0");
  const [selectedNode, setSelectedNode] = useState("novelis");
  const [animate, setAnimate] = useState(false);

  /* [v3.0] API state — BE에서 완성된 nodeDetails 직접 수신 */
  const [productData, setProductData] = useState(null);
  const [nodeDetails, setNodeDetails] = useState({});
  const [requests, setRequests] = useState([]);

  /* short_name → FE 노드 키 (단순 조회, 변환 로직 없음) */
  const NODE_KEY = { novelis: "노벨리스코리아", krm: "케이알엠", comilog: "Comilog", riotinto: "Windalco" };

  /* [v3.0] API 조회 — 모든 useEffect는 early return 전에 배치 */
  useEffect(() => {
    if (!productId) return;
    GET(`/supplychain/products/${productId}`).then(json => {
      if (json.status && json.data) {
        setProductData(json.data.bom || {});
        setNodeDetails(json.data.nodeDetails || {});
        setRequests(json.data.requests || []);
      }
    });
  }, [productId]);

  /* 버전/노드 변경 시 애니메이션 */
  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [selectedVersion, selectedNode]);

  /* [v3.0] nodeDetail — BE 데이터 직접 사용 */
  const defaultNode = { title: "-", partNo: "-", part: "-", weight: "-", qty: "-", leadtime: "-", spec: "-", origin: "-", dim: "-", chem: { mn: 0, cu: 0, si: 0, fe: 0, al: 0 } };
  const nodeDetail = nodeDetails[NODE_KEY[selectedNode]] || defaultNode;

  // 화학 성분 수치에 따른 고(Red), 중(Amber), 저(Green) 리스크 분류 로직
  const getRiskLevel = (name, valueStr) => {
    const val = parseFloat(valueStr);
    if (name === "al" || name === "Al") {
      if (val < 90) return "high";
      if (val < 98) return "medium";
      return "low";
    } else {
      if (val >= 10.0) return "high";
      if (val >= 1.0) return "medium";
      return "low";
    }
  };

  // 리스크 등급에 맞는 바 색상 매핑
  const getRiskColorClass = (riskLevel) => {
    if (riskLevel === "high") return "bg-red-500";
    if (riskLevel === "medium") return "bg-amber-500";
    return "bg-emerald-500";
  };

  // 화학 성분 너비 계산법 (정적 HTML 스펙과 동일)
  const getWidthPercent = (name, valStr) => {
    const val = parseFloat(valStr);
    if (name === "mn") return val;
    if (name === "cu") return val * 10;
    if (name === "si") return val * 10;
    if (name === "fe") return val * 5;
    if (name === "al") return val;
    return val;
  };

  const chemItems = [
    { key: "mn", label: "Mn (망간)", unitVal: `${nodeDetail.chem.mn}%`, rawVal: nodeDetail.chem.mn },
    { key: "cu", label: "Cu (구리)", unitVal: `${nodeDetail.chem.cu}%`, rawVal: nodeDetail.chem.cu },
    { key: "si", label: "Si (규소)", unitVal: `${nodeDetail.chem.si}%`, rawVal: nodeDetail.chem.si },
    { key: "fe", label: "Fe (철)", unitVal: `${nodeDetail.chem.fe}%`, rawVal: nodeDetail.chem.fe },
    { key: "al", label: "Al (알루미늄)", unitVal: `${nodeDetail.chem.al}%`, rawVal: nodeDetail.chem.al }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full h-full flex flex-col text-sm md:text-base">

      {/* 상단 정보 헤딩 및 목록 이동 인터페이스 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#03a94d] tracking-tight">공급망 맵 상세</h2>
          <p className="text-sm text-gray-400 mt-0.5">선택한 제품의 BOM 구조 및 N차 공급망 상세 정보와 이력을 추적합니다.</p>
        </div>

        <div>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-700 transition cursor-pointer bg-white shadow-3xs"
          >
            &larr; 목록으로 돌아가기
          </button>
        </div>
      </div>

      {/* 제품 개요 및 버전 관리 인터페이스 (b-1 사양) */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
        {/* [좌측 정보 그룹] */}
        <div class="flex flex-wrap items-center gap-8 md:gap-16">
          {/* 블록 1 (대상 제품군) */}
          <div class="flex flex-col">
            <span class="text-sm text-gray-400">대상 제품군</span>
            <span class="text-lg font-bold text-gray-900 mt-0.5">{productData?.product || productId}</span>
          </div>

          {/* 세로 구분선 */}
          <div class="w-px h-10 bg-gray-200 hidden sm:block"></div>

          {/* 블록 2 (버전 히스토리 선택) */}
          <div class="flex flex-col">
            <span class="text-sm text-gray-400 mb-1">버전 히스토리 선택</span>
            <select
              id="version-select"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="v2.0">v2.0 (2026-05-15 부터 2026-12-31) [최신]</option>
              <option value="v1.0">v1.0 (2025-01-01 부터 2026-05-14)</option>
            </select>
          </div>
        </div>

        {/* [우측 독립 블록] */}
        <div class="flex flex-col sm:items-end">
          <span class="text-sm text-gray-400 mb-1">BOM 검증 상태</span>
          <div id="bom-status-badge-container">
            {selectedVersion === "v2.0" ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                활성
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                비활성
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2분할 레이아웃 (좌측 8 / 우측 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* 좌측 영역 (8열) */}
        <div className="lg:col-span-8 flex flex-col space-y-5">

          {/* 공급망 정보 요청 및 응답 진행 현황 원장 테이블 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm md:text-base font-bold text-[#03a94d]">공급망 정보 요청 및 응답 진행 현황 ({productData?.bomId || productId})</h3>
              <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded animate-pulse">긴급조사 진행중</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-sm text-gray-700 table-fixed">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/30 text-gray-500 font-bold">
                    <th className="px-4 py-3 w-[32%] text-center">요청 분류 항목</th>
                    <th className="px-4 py-3 w-[17%] text-center">대상 공급 협력사</th>
                    <th className="px-4 py-3 w-[17%] text-center">연결 투입 자재명</th>
                    <th className="px-4 py-3 w-[17%] text-center">요청 및 발송일자</th>
                    <th className="px-4 py-3 w-[17%] text-center">현재 진척 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 truncate text-center">{req.item}</td>
                      <td className="px-4 py-3 truncate text-center">{req.partner}</td>
                      <td className="px-4 py-3 truncate text-center">{req.material}</td>
                      <td className="px-4 py-3 text-center">{req.date}</td>
                      <td className="px-4 py-3 text-center">
                        {req.status === "checking" ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                            {req.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
                            {req.statusLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 공급망 맵 다단계 계층 트리 전개 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 flex-1 flex flex-col">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#03a94d]">공급망 맵</h3>
              <p className="text-sm text-gray-400 mt-1">* 협력사를 클릭하시면 해당 협력사의 BOM 및 원자재 정보가 우측 패널에 표시됩니다.</p>
            </div>

            {/* 가로/세로 트리 시각화 패널 */}
            <div className="relative py-4 px-2 bg-slate-50/50 rounded-xl border border-gray-200/50 flex-1 min-h-[460px] overflow-x-auto">
              <div className="relative w-[600px] h-[440px] mx-auto">
                {/* SVG 곡선/실선 연결선 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* 1차 -> 2차 실선 */}
                  <line x1="300" y1="116" x2="300" y2="178" stroke="#cbd5e1" strokeWidth="2" />
                  {/* 2차 -> 3차-A (Comilog) 곡선 */}
                  <path d="M 300 284 C 300 310, 160 310, 160 338" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                  {/* 2차 -> 3차-B (Rio Tinto) 곡선 */}
                  <path d="M 300 284 C 300 310, 440 310, 440 338" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                </svg>

                {/* 1차 협력사 레벨 (저위험: 초록 테마) */}
                <button
                  type="button"
                  id="node-novelis"
                  onClick={() => setSelectedNode('novelis')}
                  className={`absolute left-1/2 -translate-x-1/2 top-3 w-60 bg-emerald-50/40 border-2 border-emerald-500 shadow-md rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'novelis' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded">1차 가공</span>
                    <span className="text-xs text-emerald-700 font-bold">저위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">노벨리스 코리아</p>
                  <p className="text-sm text-emerald-800 mt-1 font-semibold">압연 및 합금 가공 플레이트</p>
                </button>

                {/* 2차 제련소 레벨 (중위험: 노란 테마) */}
                <button
                  type="button"
                  id="node-krm"
                  onClick={() => setSelectedNode('krm')}
                  className={`absolute left-1/2 -translate-x-1/2 top-[180px] w-60 bg-amber-50/40 border-2 border-amber-400 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'krm' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">2차 제련</span>
                    <span className="text-xs text-amber-700 font-bold">중위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">케이알엠(주)</p>
                  <p className="text-sm text-amber-800 mt-1 font-semibold">재생 알루미늄 용해/제련</p>
                </button>

                {/* 3차 채굴사 레벨 (2개 노드) */}
                {/* Comilog 가봉 (중위험: 노란 테마) */}
                <button
                  type="button"
                  id="node-comilog"
                  onClick={() => setSelectedNode('comilog')}
                  className={`absolute left-[40px] top-[340px] w-60 bg-amber-50/40 border-2 border-amber-400 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'comilog' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">3차 채굴</span>
                    <span className="text-xs text-amber-700 font-bold">중위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">Comilog 가봉 광산 자산</p>
                  <p className="text-sm text-amber-800 mt-1 font-semibold">망간 광석 채굴 및 파쇄 공정</p>
                </button>

                {/* Rio Tinto (고위험: 붉은 테마) */}
                <button
                  type="button"
                  id="node-riotinto"
                  onClick={() => setSelectedNode('riotinto')}
                  className={`absolute right-[40px] top-[340px] w-60 bg-red-50/40 border-2 border-red-500 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'riotinto' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">3차 채굴</span>
                    <span className="text-xs text-red-700 font-bold">고위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">Rio Tinto 보크사이트 인프라</p>
                  <p className="text-sm text-red-800 mt-1 font-semibold">보크사이트(알루미늄 원광) 수급</p>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 우측 영역 - 명세서 패널 (4열 / h-full flex flex-col 설정으로 좌측과 높이 매칭) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            {/* 명세서 헤더 및 매핑 스탬프 버전 표기 */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs md:text-sm font-bold">협력사 명세</h3>
                <p id="selected-company-title" className="text-md md:text-lg text-emerald-400 font-bold mt-0.5">
                  {nodeDetail.title}
                </p>
              </div>
            </div>

            {/* justify-start 및 tight spacing 조율을 통해 공백 제거 및 꽉 찬 레이아웃 구성 */}
            <div className="p-5 space-y-6 flex-1 flex flex-col justify-start overflow-y-auto">

              <div className="space-y-5">
                {/* BOM 정보 영역 */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-emerald-600 uppercase tracking-wider pb-1.5 border-b border-gray-100">BOM 정보</h4>
                  <div className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">품번</span>
                      <span id="bom-part-no" className="font-bold text-gray-800">{nodeDetail.partNo}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">투입 부품명</span>
                      <span id="bom-part" className="font-bold text-gray-800">{nodeDetail.part}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">BOM 단위 중량</span>
                      <span id="bom-weight" className="font-bold text-gray-800">{nodeDetail.weight}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">BOM 소요 수량</span>
                      <span id="bom-qty" className="font-bold text-gray-800">{nodeDetail.qty}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400 font-medium">공정내 리드타임</span>
                      <span id="bom-leadtime" className="font-bold text-gray-800">{nodeDetail.leadtime}</span>
                    </div>
                  </div>
                </div>

                {/* 원자재 정보 영역 */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-emerald-600 uppercase tracking-wider pb-1.5 border-b border-gray-100">원자재 정보</h4>
                  <div className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">원자재 스펙명</span>
                      <span id="mat-spec" className="font-bold text-gray-800">{nodeDetail.spec}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">소재지/원산지</span>
                      <span id="mat-origin" className="font-bold text-gray-800">{nodeDetail.origin}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">자재 치수 사양</span>
                      <span id="mat-dim" className="font-bold text-gray-800">{nodeDetail.dim}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 화학 구성요소 비율 */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-xs md:text-sm font-bold text-gray-500">주요 화학 구성요소 비율 명세</p>
                <div id="chemical-container" className="space-y-3 text-xs md:text-sm">
                  {chemItems.map((item) => {
                    const barColor = "bg-emerald-500";
                    const widthPercent = getWidthPercent(item.key, item.rawVal);
                    const styleWidth = animate ? `${widthPercent}%` : '0%';

                    return (
                      <div key={item.key}>
                        <div className="flex justify-between mb-1 text-gray-600 font-semibold text-xs md:text-sm">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.unitVal}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
                            style={{ width: styleWidth }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupplyChainMapDetail;
