// src/homes/partners/materials/MaterialCommon.jsx
// ─────────────────────────────────────────────────────────────
// 워크플로우 공용 모듈 (상수 · 헬퍼 · 표현 원자) — 단일 .jsx
//   [상수/헬퍼] STATUS_META, normalizeStatus, TIER_LABEL, can,
//              resolveLogin, pickList, EMPTY_MATERIAL, toNum
//   [표현 원자] StatusBadge, UrgencyBadge, TierTag, Field, inputCls
// ─────────────────────────────────────────────────────────────

/* ========================= 상수 · 헬퍼 ========================= */

// 워크플로우 상태 흐름:
// REQUESTED → IN_PROGRESS → SUBMITTED → APPROVED → FINAL
//                              ↓
//                          REJECTED → (수정 후) → SUBMITTED
export const STATUS_META = {
  REQUESTED:   { label: "요청 접수",  cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  IN_PROGRESS: { label: "작성 중",    cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  SUBMITTED:   { label: "승인 대기",  cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  APPROVED:    { label: "승인 완료",  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED:    { label: "반려",       cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  FINAL:       { label: "최종 등록",  cls: "bg-emerald-600 text-white ring-emerald-600" },
};

// DB status 값을 FE 표준 키로 정규화 (기존 normalizeStatus 패턴 준수)
export const normalizeStatus = (raw) => {
  if (!raw) return "REQUESTED";
  const s = String(raw).toUpperCase();
  if (s === "ACTIVE" || s === "NORMAL") return "REQUESTED";
  return STATUS_META[s] ? s : "REQUESTED";
};

export const TIER_LABEL = { 0: "원청사", 1: "1차 가공", 2: "2차 제련", 3: "3차 채굴" };

// 차수별 권한 매트릭스 (workflow.py 와 동일)
export const can = {
  createRequest: (t) => [0, 1, 2].includes(t),
  approveReject: (t) => [1, 2].includes(t),
  submitUpper:   (t) => [2, 3].includes(t),
  finalRegister: (t) => t === 1,
  draft:         (t) => [1, 2, 3].includes(t),
};

// loginData → { companyCode, companyName, tier } 로 정규화
// ⚠️ 이식 시 이 함수의 필드명만 실제 App.jsx 가 내려주는 키와 맞추면 됩니다.
export const resolveLogin = (loginData) => {
  const d = loginData || {};
  return {
    companyCode: d.companyCode ?? d.company_code ?? d.partnerId ?? d.partner_id ?? "",
    companyName: d.companyName ?? d.company_name ?? d.partnerName ?? "",
    tier: Number(d.tier ?? d.partnerTier ?? d.partner_tier ?? 0),
  };
};

// 응답 본문에서 배열 안전 추출 (BE 응답 키 편차 흡수)
export const pickList = (data) =>
  Array.isArray(data)
    ? data
    : (data?.requests || data?.partners || data?.list || data?.rows || data?.tree || data?.items || []);

// 폼 상태 키 = BE Pydantic 필드명과 1:1 (SaveDraftBody / FinalRegisterBody)
// ※ FEOC·TRIR은 원자재가 아닌 기업(COMPANY) 단위 지표이므로 기업정보 등록에서 관리 → 폼에서 제외
export const EMPTY_MATERIAL = {
  rawName: "",     // 원자재명
  origin: "",      // 원산지
  width: "",       // 규격 폭 (float)
  length: "",      // 규격 길이 (float)
  weightKg: "",    // 중량 kg (float)
  components: "",  // 화학 성분비 (str)
  note: "",        // 전용 컬럼 없음 → draftJson.note 로 전송
};

// "" / null → null, 그 외 Number 변환 (Optional[float] 대응)
export const toNum = (v) => (v === "" || v == null ? null : Number(v));

// 필터 칩 순서 (전체 + 상태별)
export const STATUS_ORDER = ["REQUESTED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "FINAL"];

/* ========================= 표현 원자 ========================= */

export const StatusBadge = ({ status }) => {
  const meta = STATUS_META[normalizeStatus(status)];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
};

export const UrgencyBadge = ({ type }) => {
  const urgent = String(type).toUpperCase() === "URGENT";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
        urgent ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {urgent && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {urgent ? "긴급" : "일반"}
    </span>
  );
};

export const TierTag = ({ tier }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
    {TIER_LABEL[tier] ?? `${tier}차`}
  </span>
);

export const Field = ({ label, children, required }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-medium text-slate-500">
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </span>
    {children}
  </label>
);

export const inputCls =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none " +
  "transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400";
