# src/models/invite.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-05 — 협력사 초대 비즈니스 로직
#
# [모듈 구성]
#   getInviteMessageProcess : role_code별 초대 메시지 조회
#   sendInviteProcess       : partner_id 생성 + COMPANY INSERT + Kafka 이메일 발송
#   verifyInviteLinkProcess : 최초 접속 / 재접속 검증 (is_registered)
#   _generatePartnerId      : 회사명 → partner_id 자동 생성 알고리즘
# ────────────────────────────────────────────────────────

import re
import unicodedata
from src.utils.db import findOne, findAll, save
from src.utils.kafkasv import sendToKafka
from src.models.model import responseModel


# ════════════════════════════════════════════════════════════
# ■ 초대 메시지 조회
# ════════════════════════════════════════════════════════════

def getInviteMessageProcess(roleCode: str) -> dict:
    """role_code에 매칭되는 초대 메시지(제목 + 초대사 안내 + 피초대사 본문) 조회"""
    sql = """
        SELECT message_subject, sent_message, message_content
        FROM `INVITATION_MESSAGE`
        WHERE role_code = ? AND delete_yn = 0
        LIMIT 1
    """
    row = findOne(sql, (roleCode,))
    if not row:
        return responseModel(False, "초대 메시지를 찾을 수 없습니다.")
    return responseModel(True, "조회 성공", row)


# ════════════════════════════════════════════════════════════
# ■ 초대 발송 (partner_id 생성 + COMPANY INSERT + Kafka)
# ════════════════════════════════════════════════════════════

def sendInviteProcess(model) -> dict:
    """
    [흐름]
    1. partner_id 자동 생성 (회사명 기반 알고리즘)
    2. COMPANY 테이블에 기본 데이터 INSERT (is_registered=0)
    3. Kafka를 통해 초대 이메일 발송
    """
    try:
        companyName = model.companyName
        email = model.email
        ceoName = model.ceoName
        messageContent = model.messageContent
        tier = model.tier
        parentId = model.parentId
        roleCode = model.roleCode

        # 1. partner_id 자동 생성
        partnerId = _generatePartnerId(companyName, tier)

        # 중복 체크
        existSql = "SELECT id FROM `COMPANY` WHERE partner_id = ? AND delete_yn = 0"
        if findOne(existSql, (partnerId,)):
            return responseModel(False, f"이미 등록된 협력사 코드입니다: {partnerId}")

        # tier_label 결정
        tierLabelMap = {1: "1차 협력사", 2: "2차 협력사", 3: "3차-A"}
        tierLabel = tierLabelMap.get(tier, f"{tier}차 협력사")

        # 2. COMPANY 테이블 INSERT (is_registered=0 = 미등록 상태)
        insertSql = """
            INSERT INTO `COMPANY` (
                partner_id, company_name, short_name, ceo_name, email,
                tier, tier_label, parent_id, status, is_registered
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INVITED', 0)
        """
        params = (partnerId, companyName, companyName, ceoName, email,
                  tier, tierLabel, parentId)
        result = save(insertSql, params)
        if not result:
            return responseModel(False, "협력사 기본 데이터 저장에 실패했습니다.")

        # 3. Kafka 이메일 발송 (type=6: 협력사 초대)
        # 초대 메시지 제목 조회
        msgSql = "SELECT message_subject FROM `INVITATION_MESSAGE` WHERE role_code = ? AND delete_yn = 0 LIMIT 1"
        msgRow = findOne(msgSql, (roleCode,))
        messageSubject = msgRow["message_subject"] if msgRow else "협력사 및 공급망 맵 초대"

        kafkaData = {
            "type": 6,
            "email": email,
            "companyName": companyName,
            "messageSubject": messageSubject,
            "messageContent": messageContent,
            "partnerId": partnerId,
        }
        sendToKafka(kafkaData)

        return responseModel(True, "초대가 성공적으로 발송되었습니다.", {
            "partnerId": partnerId,
            "companyName": companyName,
            "email": email,
            "tier": tier,
        })

    except Exception as e:
        return responseModel(False, f"초대 처리 중 오류가 발생했습니다: {str(e)}")


# ════════════════════════════════════════════════════════════
# ■ 초대 링크 검증 (최초 접속 / 재접속 분기)
# ════════════════════════════════════════════════════════════

def verifyInviteLinkProcess(partnerId: str) -> dict:
    """
    [반환 data.accessType]
      "free_pass"     : 최초 접속 → 2차 인증 없이 바로 등록 화면 진입
      "require_auth"  : 등록 완료 후 재접속 → 2차 인증 필수
      "not_found"     : 유효하지 않은 링크
    """
    sql = "SELECT partner_id, company_name, email, is_registered FROM `COMPANY` WHERE partner_id = ? AND delete_yn = 0"
    company = findOne(sql, (partnerId,))

    if not company:
        return responseModel(False, "유효하지 않은 초대 링크입니다.", {"accessType": "not_found"})

    if company["is_registered"] == 0:
        # 최초 접속: 프리패스 허용 + 선입력 데이터 반환
        return responseModel(True, "최초 접속 — 등록 화면으로 이동합니다.", {
            "accessType": "free_pass",
            "company": company,
        })
    else:
        # 등록 완료 후 재접속: 2차 인증 필수
        return responseModel(True, "등록이 완료된 기업입니다. 2차 인증 후 로그인해 주세요.", {
            "accessType": "require_auth",
        })


# ════════════════════════════════════════════════════════════
# ■ partner_id 자동 생성 알고리즘
# ════════════════════════════════════════════════════════════

def _generatePartnerId(companyName: str, tier: int) -> str:
    """
    [알고리즘]
    1. (주), ㈜ 제거
    2. 한글이면 → 초성 추출 3자 (영문 변환 대체)
    3. 영문이면 → 앞 3글자 대문자
    4. 하이픈 + 차수 3자리 포맷 (예: NOV-001)

    [예시]
      "(주)노벨리스코리아", tier=1 → "NOB-001"
      "Comilog Gabon S.A.", tier=3 → "COM-003"
      "㈜케이알엠", tier=2 → "KEI-002"
    """
    # 1. (주), ㈜ 제거
    cleaned = companyName.strip()
    cleaned = re.sub(r'^[\(（]주[\)）]|^㈜', '', cleaned).strip()

    # 2. 한글 판별 및 처리
    if _containsKorean(cleaned):
        prefix = _koreanToCode(cleaned)
    else:
        # 영문: 앞 3글자 대문자
        alphaOnly = re.sub(r'[^A-Za-z]', '', cleaned)
        prefix = alphaOnly[:3].upper() if len(alphaOnly) >= 3 else alphaOnly.upper().ljust(3, 'X')

    # 3. 차수 3자리 포맷
    tierStr = str(tier).zfill(3)

    return f"{prefix}-{tierStr}"


def _containsKorean(text: str) -> bool:
    """텍스트에 한글이 포함되어 있는지 확인"""
    for char in text:
        if '\uAC00' <= char <= '\uD7A3' or '\u3131' <= char <= '\u3163':
            return True
    return False


def _koreanToCode(koreanName: str) -> str:
    """
    한글 회사명 → 영문 3글자 코드 변환
    초성 추출 후 영문 매핑 (ㄱ→G, ㄴ→N, ㄷ→D, ...)
    """
    CHOSUNG_MAP = {
        'ㄱ': 'G', 'ㄲ': 'G', 'ㄴ': 'N', 'ㄷ': 'D', 'ㄸ': 'D',
        'ㄹ': 'R', 'ㅁ': 'M', 'ㅂ': 'B', 'ㅃ': 'B', 'ㅅ': 'S',
        'ㅆ': 'S', 'ㅇ': 'A', 'ㅈ': 'J', 'ㅉ': 'J', 'ㅊ': 'C',
        'ㅋ': 'K', 'ㅌ': 'T', 'ㅍ': 'P', 'ㅎ': 'H',
    }
    CHOSUNG_LIST = list(CHOSUNG_MAP.keys())

    result = []
    for char in koreanName:
        if '\uAC00' <= char <= '\uD7A3':
            # 유니코드 한글 분해 → 초성 추출
            code = ord(char) - 0xAC00
            chosung_idx = code // (21 * 28)
            chosung = CHOSUNG_LIST[chosung_idx]
            result.append(CHOSUNG_MAP.get(chosung, 'X'))
        elif char.isalpha():
            result.append(char.upper())
        if len(result) >= 3:
            break

    return ''.join(result[:3]).ljust(3, 'X')
