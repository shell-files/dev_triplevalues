// src/homes/partners/materials/MaterialForm.jsx
// ─────────────────────────────────────────────────────────────
// 자사 원자재 정보 입력 폼
//   - 폼 키는 BE Pydantic(SaveDraftBody / FinalRegisterBody) 필드명과 1:1
//   props:
//     form     : 폼 상태 객체 (EMPTY_MATERIAL 형태)
//     onChange : (nextForm) => void
//     readOnly : 입력 잠금 여부
// ─────────────────────────────────────────────────────────────

import { Field, inputCls } from "./MaterialCommon";

const MaterialForm = ({ form, onChange, readOnly }) => {
  const set = (k) => (e) => onChange({ ...form, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="원자재명" required>
        <input className={inputCls} value={form.rawName} onChange={set("rawName")} disabled={readOnly} placeholder="예: AA3003 압연 코일" />
      </Field>
      <Field label="원산지" required>
        <input className={inputCls} value={form.origin} onChange={set("origin")} disabled={readOnly} placeholder="예: 대한민국 / 자메이카" />
      </Field>
      <Field label="규격 - 폭 (mm)">
        <input className={inputCls} type="number" value={form.width} onChange={set("width")} disabled={readOnly} />
      </Field>
      <Field label="규격 - 길이 (mm)">
        <input className={inputCls} type="number" value={form.length} onChange={set("length")} disabled={readOnly} />
      </Field>
      <Field label="중량 (kg)">
        <input className={inputCls} type="number" value={form.weightKg} onChange={set("weightKg")} disabled={readOnly} />
      </Field>
      <Field label="화학 성분비 (Mn/Cu/Si/Fe/Al)">
        <input className={inputCls} value={form.components} onChange={set("components")} disabled={readOnly} placeholder="예: Mn1.2 / Cu0.1 / Si0.6 / Fe0.7 / Al97.4" />
      </Field>
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="비고">
          <textarea className={`${inputCls} h-20 py-2`} value={form.note} onChange={set("note")} disabled={readOnly} />
        </Field>
      </div>
    </div>
  );
};

export default MaterialForm;
