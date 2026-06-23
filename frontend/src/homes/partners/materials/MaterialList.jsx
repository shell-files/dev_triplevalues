// src/homes/partners/materials/MaterialList.jsx
// ─────────────────────────────────────────────────────────────
// 원자재 요청 목록 (풀폭 테이블) — [공급망 맵 제품 리스트] 톤앤매너에 동기화
//   상단: 녹색 타이틀 + 부제 + 새로고침
//   검색: 요청 검색 입력 (제품명/BOM/요청처/수신처 실시간 필터)
//   필터: 요청 상태 칩 (전체 / 상태별 건수)
//   결과: "조회된 요청 : N건" 헤더 + 풀폭 테이블 (행 클릭 → onSelect)
//   props:
//     requests : 요청 row 배열 (각 row 에 productName 하이드레이션 포함)
//     loading  : 목록 로딩 여부
//     me       : { companyCode, companyName, tier }
//     onSelect : (row) => void
//     onRefresh: () => void
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import {
  STATUS_META,
  STATUS_ORDER,
  normalizeStatus,
  StatusBadge,
  UrgencyBadge,
  TierTag,
} from "./MaterialCommon";

const MaterialList = ({ requests, loading, me, onSelect, onRefresh }) => {
  const [filter, setFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  // [#3] 목록은 oem_po_id 단위로 '대표 1건'만 노출.
  //   대표 = 가장 마지막으로 생성·갱신된(=최하위 진행 단계) 요청 → 최종 진행 중인 단계.
  const repRequests = useMemo(() => {
    const byPo = new Map();
    for (const r of requests) {
      const key = r.oemPoId || r.requestId;
      const cur = byPo.get(key);
      if (!cur || String(r.createdAt || "") > String(cur.createdAt || "")) byPo.set(key, r);
    }
    return [...byPo.values()];
  }, [requests]);

  const countOf = (key) =>
    key === "ALL" ? repRequests.length : repRequests.filter((r) => normalizeStatus(r.status) === key).length;

  const chips = [
    { key: "ALL", label: "전체" },
    ...STATUS_ORDER.map((k) => ({ key: k, label: STATUS_META[k].label })),
  ];

  // [#3] 상태 칩 + [#3 검색] 키워드 실시간 필터 (대표 요청 대상)
  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return repRequests.filter((r) => {
      if (filter !== "ALL" && normalizeStatus(r.status) !== filter) return false;
      if (!kw) return true;
      const hay = [r.productName, r.bomId, r.requesterName, r.requesterId, r.receiverName, r.receiverId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [repRequests, filter, keyword]);

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-700">원자재 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            원자재 요청 접수 · 승인/반려 · 최종 등록 처리 원장
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          새로고침
        </button>
      </div>

      {/* 검색 + 필터 카드 (공급망 맵 스타일) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-semibold text-slate-600">요청 검색</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색할 키워드를 입력하세요 (예: Al 3003-H14, BOM-001, 노벨리스 등)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-sm font-semibold text-slate-500">요청 상태</span>
          {chips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label} ({countOf(c.key)})
              </button>
            );
          })}
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <span className="text-sm font-bold text-slate-700">
            조회된 요청 : <span className="text-emerald-700">{rows.length}건</span>
          </span>
          <span className="text-xs text-slate-400">* 행을 클릭하면 상세 처리 화면으로 이동합니다.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">No.</th>
                <th className="px-5 py-3">제품 (BOM)</th>
                <th className="px-5 py-3">요청처</th>
                <th className="px-5 py-3">수신처</th>
                <th className="px-5 py-3">차수</th>
                <th className="px-5 py-3">긴급도</th>
                <th className="px-5 py-3">등록일</th>
                <th className="px-5 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">불러오는 중…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    {keyword.trim()
                      ? `"${keyword.trim()}" 검색 결과가 없습니다.`
                      : "접수된 원자재 요청이 없습니다."}
                    {me?.companyCode && !keyword.trim() && (
                      <span className="ml-1 text-xs text-slate-300">(조회 기준: {me.companyCode})</span>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={r.requestId}
                    onClick={() => onSelect(r)}
                    className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-emerald-50/50"
                  >
                    <td className="px-5 py-4 text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-700">
                        {r.productName || r.bomId || "-"}
                      </span>
                      {r.productName && r.bomId && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">{r.bomId}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{r.requesterName || r.requesterId}</td>
                    <td className="px-5 py-4 text-slate-600">{r.receiverName || r.receiverId}</td>
                    <td className="px-5 py-4"><TierTag tier={r.receiverTier} /></td>
                    <td className="px-5 py-4"><UrgencyBadge type={r.requestType} /></td>
                    <td className="px-5 py-4 text-slate-400">{r.createdAt}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialList;
