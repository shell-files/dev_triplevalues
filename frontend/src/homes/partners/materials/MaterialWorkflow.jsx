// src/homes/partners/materials/MaterialWorkflow.jsx
// ─────────────────────────────────────────────────────────────
// [v2.0] 공급망 워크플로우 — 원자재 관리 (컨테이너)
//   상태 · API 통신 · 액션 핸들러를 보유하고, 표현은 하위 컴포넌트에 위임.
//     ├ MaterialList    (좌: 요청 목록 마스터 그리드)
//     └ MaterialDetail  (우: 요약 + 단계별 상태 + 폼 + 액션)
//        └ MaterialForm (자사 원자재 입력 폼)
//   공용 메타/헬퍼/표현 원자 → MaterialCommon.jsx (단일 .jsx, 별도 .js 없음)
//
// 연동 BE: src/apis/workflow.py (prefix: /workflow)
//   POST /workflow/draft           SaveDraftBody     (평탄 원자재 + draftJson)
//   POST /workflow/submit          SubmitToUpperBody (requestId/partnerId/partnerTier)
//   POST /workflow/approve         ApproveRejectBody (+ partnerTier)
//   POST /workflow/reject          RejectBody        (+ reason)
//   POST /workflow/final-register  FinalRegisterBody (rawName 필수 + 평탄 원자재)
//   GET  /workflow/requests/{partnerId}        기업별 요청 목록
//   GET  /workflow/tree/{oemPoId}              PO 기준 전체 체인
//   GET  /workflow/draft/{reqId}/{partnerId}   임시 저장 조회
//
// ※ 같은 폴더의 형제 파일은 상대경로(./)로 import.
//   프로젝트에 homes 용 @ alias 가 있으면 그쪽으로 교체해도 무방합니다.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { GET, POST } from "@utils/Network";
import {
  EMPTY_MATERIAL,
  resolveLogin,
  pickList,
  toNum,
} from "./MaterialCommon";
import MaterialList from "./MaterialList";
import MaterialDetail from "./MaterialDetail";

const MaterialWorkflow = ({ loginData, apiCompanies }) => {
  const me = useMemo(() => resolveLogin(loginData), [loginData]);

  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null); // 선택된 요청 row
  const [chain, setChain] = useState([]);          // oem_po_id 기준 전체 체인
  const [form, setForm] = useState(EMPTY_MATERIAL);
  const [rejectReason, setRejectReason] = useState("");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok: bool, msg: string }

  const notify = (ok, msg) => {
    setFeedback({ ok, msg });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setFeedback(null), 3500);
  };

  /* ── [#2] 내 요청(myNode): 체인에서 receiver = 나 인 단계 = 자사 폼의 기준 ──
     selected(목록 대표)는 내가 보낸 하위 요청일 수 있으므로 분리한다.
  */
  const myNode = useMemo(
    () => (chain || []).find((n) => n.receiverId === me.companyCode) || selected,
    [chain, me.companyCode, selected]
  );

  /* ── [#3·#4] 하위 노드 개별 검수 상태 ── */
  const [inspectNode, setInspectNode] = useState(null);   // 클릭한 하위 협력사 노드
  const [inspectForm, setInspectForm] = useState(null);   // 그 노드가 제출한 원자재 (read-only)

  const hydrate = (d) => ({
    ...EMPTY_MATERIAL,
    rawName: d?.rawName ?? "", origin: d?.origin ?? "",
    width: d?.width ?? "", length: d?.length ?? "",
    weightKg: d?.weightKg ?? "", components: d?.components ?? "",
    note: d?.draftJson?.note ?? "",
  });

  const selectInspectNode = async (node) => {
    if (!node?.requestId) return;
    setInspectNode(node);
    setInspectForm(null);
    setRejectReason("");
    // 하위 노드 작성 주체(receiverId)의 임시저장/제출 데이터 로드
    const res = await GET(`/workflow/draft/${node.requestId}/${node.receiverId}`);
    setInspectForm(res?.status && res.data ? hydrate(res.data.draft || res.data) : {});
  };

  /* ── 요청 목록 로드 ── */
  const loadRequests = useCallback(async () => {
    if (!me.companyCode) {
      // loginData 에서 기업 코드를 못 찾은 경우 — 조용히 실패하지 않도록 안내
      notify(false, "로그인 정보에서 기업 코드를 찾지 못했습니다. (resolveLogin 필드명 확인 필요)");
      return;
    }
    setLoadingList(true);
    const res = await GET(`/workflow/requests/${me.companyCode}`);
    setLoadingList(false);
    if (res?.status) {
      setRequests(pickList(res.data));
    } else {
      notify(false, res?.message || res?.error || "요청 목록을 불러오지 못했습니다.");
    }
  }, [me.companyCode]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* ── 요청 선택 → 체인 + (내 단계) 임시저장 로드 ── */
  const selectRequest = async (row) => {
    setSelected(row);
    setRejectReason("");
    setForm(EMPTY_MATERIAL);
    setInspectNode(null);
    setInspectForm(null);
    setLoadingDetail(true);

    // 1) 전체 체인 조회
    const treeRes = await GET(`/workflow/tree/${row.oemPoId}`);
    const ch = treeRes?.status ? pickList(treeRes.data) : [];
    setChain(ch);

    // 2) [#2] 자사 폼은 '내가 수신자인 단계(myNode)'의 임시저장으로 복원 (selected 아님)
    const myn = ch.find((n) => n.receiverId === me.companyCode) || row;
    const draftRes = await GET(`/workflow/draft/${myn.requestId}/${me.companyCode}`);
    if (draftRes?.status && draftRes.data) {
      setForm(hydrate(draftRes.data.draft || draftRes.data));
    }
    setLoadingDetail(false);
  };

  /* ── 페이로드 빌더 ──
     엔드포인트마다 Pydantic 모델이 다르므로 개별 구성한다.
       · draft  (SaveDraftBody)     : 평탄 원자재 필드 + draftJson, partnerTier 없음
       · submit (SubmitToUpperBody) : requestId/partnerId/partnerTier 만 (원자재 X)
       · approve(ApproveRejectBody) : requestId/partnerId/partnerTier (0~2)
       · reject (RejectBody)        : + reason  (※ rejectReason 아님)
       · final  (FinalRegisterBody) : rawName 필수 + 평탄 원자재 필드, partnerTier 없음
  */
  const materialFields = () => ({
    rawName: form.rawName || null,
    width: toNum(form.width),
    length: toNum(form.length),
    weightKg: toNum(form.weightKg),
    components: form.components || null,
    origin: form.origin || null,
  });

  const draftPayload = () => ({
    requestId: (myNode || selected).requestId,
    partnerId: me.companyCode,
    ...materialFields(),
    draftJson: { note: form.note || "" }, // 전용 컬럼 없는 보조 데이터
  });

  const guard = () => {
    if (!selected) {
      notify(false, "먼저 좌측에서 요청 건을 선택하세요.");
      return false;
    }
    return true;
  };

  const run = async (fn, okMsg) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res?.status) {
      notify(true, res.message || okMsg);
      await loadRequests();
      if (selected) {
        const fresh = await GET(`/workflow/tree/${selected.oemPoId}`);
        if (fresh?.status) setChain(pickList(fresh.data));
      }
    } else {
      notify(false, res?.message || res?.error || "처리에 실패했습니다.");
    }
    return res;
  };

  const handleSaveDraft = () => {
    if (!guard()) return;
    run(() => POST("/workflow/draft", draftPayload()), "임시 저장되었습니다.");
  };

  // submit 바디엔 원자재가 없으므로, 먼저 draft 로 원자재를 영속화한 뒤 상태를 전이시킨다.
  const handleSubmitUpper = () => {
    if (!guard()) return;
    if (!form.rawName || !form.origin) {
      notify(false, "원자재명과 원산지는 필수 항목입니다.");
      return;
    }
    run(async () => {
      const saved = await POST("/workflow/draft", draftPayload());
      if (!saved?.status) return saved;
      return POST("/workflow/submit", {
        requestId: (myNode || selected).requestId,
        partnerId: me.companyCode,
        partnerTier: me.tier,
      });
    }, "상위 협력사에 승인 요청했습니다.");
  };

  const handleFinalRegister = () => {
    if (!guard()) return;
    if (!form.rawName) {
      notify(false, "최종 등록에는 원자재명이 필수입니다.");
      return;
    }
    run(
      () => POST("/workflow/final-register", {
        requestId: (myNode || selected).requestId,
        partnerId: me.companyCode,
        ...materialFields(),
      }),
      "공급망 맵에 최종 등록되었습니다."
    );
  };

  // [#1·#6] 승인 취소 (자사 제출/최종 번복 → 폼 잠금 해제)
  const handleCancelApproval = () => {
    if (!guard()) return;
    run(
      () => POST("/workflow/cancel-approval", {
        requestId: (myNode || selected).requestId,
        partnerId: me.companyCode,
      }),
      "승인을 취소했습니다. 자사 정보를 다시 수정할 수 있습니다."
    );
  };

  // [#1] 반려 요청 (하위가 제출을 스스로 거두어 재수정)
  const handleRequestRollback = () => {
    if (!guard()) return;
    run(
      () => POST("/workflow/request-rollback", {
        requestId: (myNode || selected).requestId,
        partnerId: me.companyCode,
        reason: rejectReason.trim() || null,
      }),
      "반려 요청을 보냈습니다. 자사 정보를 수정할 수 있습니다."
    );
  };

  // [#3·#4] 승인/반려는 '클릭한 하위 노드(inspectNode)' 를 대상으로 처리
  const handleApprove = () => {
    if (!inspectNode) { notify(false, "검수할 하위 협력사 단계를 먼저 선택하세요."); return; }
    run(
      () => POST("/workflow/approve", {
        requestId: inspectNode.requestId,
        partnerId: me.companyCode,
        partnerTier: me.tier,
      }),
      "승인 처리되었습니다."
    ).then((r) => { if (r?.status) { setInspectNode(null); setInspectForm(null); } });
  };

  const handleReject = () => {
    if (!inspectNode) { notify(false, "검수할 하위 협력사 단계를 먼저 선택하세요."); return; }
    if (!rejectReason.trim()) {
      notify(false, "반려 사유를 입력하세요.");
      return;
    }
    run(
      () => POST("/workflow/reject", {
        requestId: inspectNode.requestId,
        partnerId: me.companyCode,
        partnerTier: me.tier,
        reason: rejectReason.trim(), // ※ BE 필드명: reason
      }),
      "반려 처리되었습니다. 하위 협력사에 알림이 전송됩니다."
    ).then((r) => { if (r?.status) { setInspectNode(null); setInspectForm(null); } });
  };

  /* ── [#4] parent_id 기반 직속 하위 협력사 조회 ──
     COMPANY.parent_id = 로그인 기업코드 인 기업만 BE에서 필터해 반환.
     무분별한 전체 노출 방지. (apiCompanies/체인은 폴백)
  */
  const [subPartners, setSubPartners] = useState([]);

  useEffect(() => {
    if (!me.companyCode) return;
    let alive = true;
    GET(`/workflow/subpartners/${encodeURIComponent(me.companyCode)}`)
      .then((res) => {
        if (alive && res?.status) setSubPartners(pickList(res.data));
      })
      .catch(() => { if (alive) setSubPartners([]); });
    return () => { alive = false; };
  }, [me.companyCode]);

  const downstreamPartners = useMemo(() => {
    const next = me.tier + 1;
    // 1순위: parent_id 기반 BE 결과 (이미 직속 하위만 내려옴)
    const fromApi = (subPartners || []).map((c) => ({
      code: c.code ?? c.partner_id ?? c.companyCode ?? "",
      name: c.name ?? c.company_name ?? c.short_name ?? c.code ?? "",
      tier: Number(c.tier ?? c.partnerTier ?? next),
    }));
    if (fromApi.length) {
      const seen = new Set();
      return fromApi.filter((c) => c.code && (seen.has(c.code) ? false : (seen.add(c.code), true)));
    }
    // 폴백: 체인에서 다음 차수 노드 (BE 미연동 시 최소 동작 보장)
    const seen = new Set();
    return (chain || [])
      .map((n) => ({ code: n.receiverId, name: n.receiverName || n.receiverId, tier: Number(n.receiverTier) }))
      .filter((c) => c.code && c.tier === next)
      .filter((c) => (seen.has(c.code) ? false : (seen.add(c.code), true)));
  }, [subPartners, chain, me.tier]);

  const handleCreateRequest = (receiverCode, requestType) => {
    if (!guard()) return;
    if (!receiverCode) {
      notify(false, "요청할 하위 협력사를 선택하세요.");
      return;
    }
    run(
      () => POST("/workflow/request", {
        oemPoId: selected.oemPoId,
        bomId: selected.bomId,
        requesterId: me.companyCode,
        requesterTier: me.tier,
        receiverId: receiverCode,        // ★ 코드(partner_id) 전송 — 명칭 아님
        receiverTier: me.tier + 1,
        requestType: requestType || "NORMAL",
      }),
      "하위 협력사에 원자재 작성을 요청했습니다."
    );
  };

  /* ───────────────────────── 렌더 ───────────────────────── */
  // 협력사 정보 화면과 동일하게 화면 자체에 상·좌·우 여백을 둔다 (부모 main 은 패딩 없음)
  // 목록 ↔ 상세 토글 (BomList/BomDetail · PartnerList/PartnerDetail 패턴)
  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-6 lg:px-16 lg:py-8">
      {/* 피드백 배너 */}
      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ${
            feedback.ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {selected ? (
        <MaterialDetail
          selected={selected}
          myNode={myNode}
          chain={chain}
          loadingDetail={loadingDetail}
          me={me}
          form={form}
          setForm={setForm}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          busy={busy}
          inspectNode={inspectNode}
          inspectForm={inspectForm}
          onSelectNode={selectInspectNode}
          onBack={() => setSelected(null)}
          onSaveDraft={handleSaveDraft}
          onSubmitUpper={handleSubmitUpper}
          onApprove={handleApprove}
          onReject={handleReject}
          onFinalRegister={handleFinalRegister}
          onCancelApproval={handleCancelApproval}
          onRequestRollback={handleRequestRollback}
          downstreamPartners={downstreamPartners}
          onCreateRequest={handleCreateRequest}
        />
      ) : (
        <MaterialList
          requests={requests}
          loading={loadingList}
          me={me}
          onSelect={selectRequest}
          onRefresh={loadRequests}
        />
      )}
    </div>
  );
};

export default MaterialWorkflow;
