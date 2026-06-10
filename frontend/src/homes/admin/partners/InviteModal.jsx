// src/homes/admin/partners/InviteModal.jsx
// ────────────────────────────────────────────────────────
// [v1.0] 2026-06-05 — 협력사 초대 팝업 모달 (Tailwind CSS)
//
// [역할] 초대사가 피초대 협력사 정보를 입력하여 초대 발송
// [사용] PartnerList.jsx에서 [초대하기] 버튼 클릭 시 open
// ────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { GET, POST } from "@utils/Network";

const InviteModal = ({ isOpen, onClose, loginData }) => {
  // ── 초대 메시지 (API에서 조회)
  const [inviteMsg, setInviteMsg] = useState({ message_subject: "", sent_message: "", message_content: "" });

  // ── 입력 폼
  const [form, setForm] = useState({ companyName: "", email: "", ceoName: "", messageContent: "" });
  const [loading, setLoading] = useState(false);

  // ── 포커스 ref
  const companyNameRef = useRef(null);
  const emailRef = useRef(null);
  const ceoNameRef = useRef(null);
  const messageContentRef = useRef(null);

  // ── 초대사 role_code 결정 (tier → role_code 매핑)
  const getRoleCode = () => {
    const tier = Number(loginData?.tier);
    if (tier === 0) return "OEM";
    if (tier === 1) return "TIER1";
    if (tier === 2) return "TIER2";
    return "TIER1";
  };

  // ── 초대 대상 tier 결정 (초대사 tier + 1)
  const getTargetTier = () => Number(loginData?.tier || 0) + 1;

  // ── 모달 열릴 때 초대 메시지 조회
  useEffect(() => {
    if (!isOpen) return;
    const roleCode = getRoleCode();
    GET(`/invite/message?roleCode=${roleCode}`)
      .then(json => {
        if (json.status && json.data) {
          setInviteMsg(json.data);
          setForm(prev => ({ ...prev, messageContent: json.data.message_content || "" }));
        }
      });
  }, [isOpen]);

  // ── 유효성 검사 + 발송
  const handleSubmit = async () => {
    // 필수 항목 검증 + 포커스 이동
    if (!form.companyName.trim()) {
      alert("필수 항목을 입력하지 않으셨습니다.");
      companyNameRef.current?.focus();
      return;
    }
    if (!form.email.trim()) {
      alert("필수 항목을 입력하지 않으셨습니다.");
      emailRef.current?.focus();
      return;
    }
    if (!form.ceoName.trim()) {
      alert("필수 항목을 입력하지 않으셨습니다.");
      ceoNameRef.current?.focus();
      return;
    }
    if (!form.messageContent.trim()) {
      alert("필수 항목을 입력하지 않으셨습니다.");
      messageContentRef.current?.focus();
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("올바른 이메일 형식을 입력해 주세요.");
      emailRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      const body = {
        companyName: form.companyName,
        email: form.email,
        ceoName: form.ceoName,
        messageContent: form.messageContent,
        tier: getTargetTier(),
        parentId: loginData?.partner_id || "",
        roleCode: getRoleCode(),
      };

      const res = await POST("/invite", body);
      if (res.status) {
        alert(`초대가 발송되었습니다.\n(partner_id: ${res.data?.partnerId})`);
        setForm({ companyName: "", email: "", ceoName: "", messageContent: "" });
        onClose();
      } else {
        alert(res.message || "초대 발송에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 연결 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 카드 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">{inviteMsg.message_subject || "협력사 초대"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-5">
          {/* 초대사 안내 메시지 (Read-Only) */}
          {inviteMsg.sent_message && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <p className="text-xs font-bold text-emerald-700 mb-1">초대 안내</p>
              <p className="text-sm text-emerald-800 leading-relaxed">{inviteMsg.sent_message}</p>
            </div>
          )}

          {/* 회사명 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">협력사 회사명 <span className="text-red-500">*</span></label>
            <input ref={companyNameRef} type="text" value={form.companyName} placeholder="초대할 협력사 회사명을 입력해 주세요"
              onChange={e => setForm(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 focus:border-[#03a94d]" />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">협력사 이메일 <span className="text-red-500">*</span></label>
            <input ref={emailRef} type="email" value={form.email} placeholder="담당자 이메일 주소를 입력해 주세요"
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 focus:border-[#03a94d]" />
          </div>

          {/* 대표자명 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">대표자명 <span className="text-red-500">*</span></label>
            <input ref={ceoNameRef} type="text" value={form.ceoName} placeholder="협력사 대표자명을 입력해 주세요"
              onChange={e => setForm(prev => ({ ...prev, ceoName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 focus:border-[#03a94d]" />
          </div>

          {/* 초대 메시지 (Textarea) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">초대 메시지 <span className="text-red-500">*</span></label>
            <textarea ref={messageContentRef} rows={5} value={form.messageContent} placeholder="피초대 협력사에게 전달할 안내 메시지를 입력해 주세요"
              onChange={e => setForm(prev => ({ ...prev, messageContent: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#03a94d]/30 focus:border-[#03a94d]" />
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: "#03a94d" }}>
            {loading ? "발송 중..." : "초대하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
