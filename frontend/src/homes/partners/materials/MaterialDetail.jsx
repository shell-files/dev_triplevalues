// src/homes/partners/materials/MaterialDetail.jsx
// ─────────────────────────────────────────────────────────────
// 요청 상세 (풀폭) — 역할 인지형 구조
//   ① 자사 원자재 정보  : myNode(내가 수신자인 단계) 기준 → 항상 표시 (#2)
//        · 상태 잠금(#6): REQUESTED/IN_PROGRESS/REJECTED 만 수정 가능,
//          SUBMITTED/APPROVED/FINAL 은 읽기전용. 승인취소/반려요청으로 해제(#1).
//   ② 공급망 단계별 상태: 하위 노드 클릭 → 하단 검수 스위칭 (#4)
//   ③ 하위 원자재 검수  : 클릭한 inspectNode 제출 데이터 바인딩 + 승인/반려 (#3)
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { can, normalizeStatus, StatusBadge, UrgencyBadge, TierTag, Field, inputCls } from "./MaterialCommon";
import MaterialForm from "./MaterialForm";

const MaterialDetail = ({
  selected, myNode, chain, loadingDetail, me,
  form, setForm, rejectReason, setRejectReason, busy,
  inspectNode, inspectForm, onSelectNode,
  onBack, onSaveDraft, onSubmitUpper, onApprove, onReject,
  onFinalRegister, onCancelApproval, onRequestRollback,
  downstreamPartners = [], onCreateRequest,
}) => {
  const [reqReceiver, setReqReceiver] = useState("");

  /* ── 권한·상태 파생 (자사 = myNode 기준) ── */
  const myStatus = normalizeStatus(myNode?.status);
  const hasMyNode = !!(myNode && myNode.receiverId === me.companyCode);
  const editable = hasMyNode && ["REQUESTED", "IN_PROGRESS", "REJECTED"].includes(myStatus);
  const canSubmit = can.submitUpper(me.tier) && editable;            // 2·3차 상위 제출
  const canFinal = can.finalRegister(me.tier) && myStatus !== "FINAL"; // 1차 최종 등록
  const showCancel = can.finalRegister(me.tier) && myStatus === "FINAL"; // 1차 승인 취소
  const showRollback = can.submitUpper(me.tier) && myStatus === "SUBMITTED"; // 2·3차 반려 요청
  const showRequestDown = can.createRequest(me.tier) && me.tier < 3;

  /* ── 검수 대상: 직속 하위(receiverTier===me.tier+1) & 제출(SUBMITTED) 만 승인/반려 ── */
  const inspectEligible =
    !!inspectNode &&
    Number(inspectNode.receiverTier) === me.tier + 1 &&
    normalizeStatus(inspectNode.status) === "SUBMITTED";

  const lockMsg = {
    SUBMITTED: "승인 대기 중 — 수정하려면 ‘반려 요청’으로 회수하세요.",
    APPROVED: "승인 완료 — 잠금 상태입니다.",
    FINAL: "최종 등록 완료 — 수정하려면 ‘승인 취소’를 누르세요.",
  }[myStatus];

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
      >
        <span aria-hidden>←</span> 목록으로
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-700">{selected.bomId}</h1>
          <UrgencyBadge type={selected.requestType} />
          <StatusBadge status={myNode?.status || selected.status} />
        </div>
        <span className="text-sm text-slate-400">PO · {selected.oemPoId}</span>
      </div>

      {/* 공급망 단계별 상태 — 하위 노드 클릭 시 검수 스위칭 (#4) */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">공급망 단계별 상태</h3>
        {loadingDetail ? (
          <div className="py-6 text-center text-sm text-slate-400">불러오는 중…</div>
        ) : (
          <ol className="space-y-2">
            {chain.map((node, i) => {
              const lower = Number(node.receiverTier) > me.tier;
              const active = inspectNode && node.requestId === inspectNode.requestId;
              const mine = node.receiverId === me.companyCode;
              return (
                <li
                  key={node.requestId || i}
                  onClick={lower ? () => onSelectNode(node) : undefined}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                    active
                      ? "border-emerald-300 bg-emerald-50"
                      : mine
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-100 bg-white"
                  } ${lower ? "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/60" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <TierTag tier={node.receiverTier} />
                    <span className="text-sm font-medium text-slate-700">{node.receiverName || node.receiverId}</span>
                    {lower && <span className="text-xs text-slate-400">· 클릭하여 검수</span>}
                  </div>
                  <StatusBadge status={node.status} />
                </li>
              );
            })}
            {chain.length === 0 && <li className="py-2 text-sm text-slate-400">연결된 체인 데이터가 없습니다.</li>}
          </ol>
        )}
      </div>

      {/* ① 자사 원자재 정보 — 항상 표시 (#2), 상태 잠금 (#6) */}
      {hasMyNode && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">자사 원자재 정보</h3>
            {!editable && lockMsg && (
              <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                🔒 {lockMsg}
              </span>
            )}
          </div>
          <MaterialForm form={form} onChange={setForm} readOnly={!editable} />

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {editable && can.draft(me.tier) && (
              <button onClick={onSaveDraft} disabled={busy}
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                임시 저장
              </button>
            )}
            {canSubmit && (
              <button onClick={onSubmitUpper} disabled={busy}
                className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                상위 협력사 제출
              </button>
            )}
            {showRollback && (
              <button onClick={onRequestRollback} disabled={busy}
                className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 disabled:opacity-50">
                반려 요청 (제출 회수)
              </button>
            )}
            {canFinal && (
              <button onClick={onFinalRegister} disabled={busy}
                className="h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50">
                최종 승인완료 (원청사 제출)
              </button>
            )}
            {showCancel && (
              <button onClick={onCancelApproval} disabled={busy}
                className="h-10 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                승인 취소 (재수정)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ② 하위 협력사 원자재 요청 (Top-Down) — 1·2차 */}
      {showRequestDown && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">하위 협력사 원자재 요청</h3>
            <TierTag tier={me.tier + 1} />
          </div>
          {downstreamPartners.length === 0 ? (
            <p className="text-sm text-slate-400">요청 가능한 하위 협력사가 없습니다. (협력사 등록 후 이용 가능)</p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Field label="하위 협력사">
                  <select className={inputCls} value={reqReceiver} onChange={(e) => setReqReceiver(e.target.value)}>
                    <option value="">선택하세요</option>
                    {downstreamPartners.map((d) => (
                      <option key={d.code} value={d.code}>{d.name ? `${d.name} (${d.code})` : d.code}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="w-44">
                <Field label="긴급도 (원청사 지정)">
                  <div className="flex h-10 items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      String(selected.requestType).toUpperCase() === "URGENT"
                        ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {String(selected.requestType).toUpperCase() === "URGENT" ? "긴급" : "일반"}
                    </span>
                    <span className="text-xs text-slate-400">변경 불가</span>
                  </div>
                </Field>
              </div>
              <button onClick={() => onCreateRequest(reqReceiver, selected.requestType)} disabled={busy || !reqReceiver}
                className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                원자재 요청하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ③ 하위 원자재 검수 — 클릭한 노드(inspectNode) 데이터 바인딩 (#3) */}
      {inspectNode && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">
              하위 원자재 검수 — {inspectNode.receiverName || inspectNode.receiverId}
            </h3>
            <div className="flex items-center gap-2">
              <TierTag tier={inspectNode.receiverTier} />
              <StatusBadge status={inspectNode.status} />
            </div>
          </div>

          {inspectForm === null ? (
            <div className="py-6 text-center text-sm text-slate-400">불러오는 중…</div>
          ) : !inspectForm.rawName && !inspectForm.origin ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              아직 제출된 원자재 데이터가 없습니다.
            </p>
          ) : (
            <MaterialForm form={inspectForm} onChange={() => {}} readOnly />
          )}

          {inspectEligible ? (
            <>
              <div className="mt-4">
                <Field label="반려 사유 (반려 시 필수)">
                  <textarea className={`${inputCls} h-20 py-2`} value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="성분비 불일치, 증빙 누락 등" />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button onClick={onReject} disabled={busy}
                  className="h-10 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                  반려
                </button>
                <button onClick={onApprove} disabled={busy}
                  className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  승인
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              조회 전용 — 직속 하위가 ‘승인 요청(제출)’한 건만 승인/반려할 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialDetail;
