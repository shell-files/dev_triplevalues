# src/models/auth.py
# ────────────────────────────────────────────────────────
# [v1.4] 2026-06-16 - sessionStorage 제거, BE 세션 관리 (GET /auth/me)
# [v1.3] 2026-06-12 - 세션 쿠키 변경 (브라우저 종료 시 자동 로그아웃)
# [v1.2] 2026-06-08 - 초대 링크 자동 로그인 (is_registered=0 → 프리패스)
# [v1.1] 2026-06-04 - UserModel→dict 수정 (JSON 직렬화 오류 해결)
# [v1.0] 2026-06-04 - 원청사/N차 협력사 로그인, 2차 인증(Kafka/Redis), JWT 토큰 관리
# ────────────────────────────────────────────────────────

from fastapi import Response, Request
from src.utils.db import findOne, save
from src.utils.tokenset import createUserTokens
from src.utils.rediscl import setTokenRedis, client1
from src.utils.kafkasv import sendToKafka
from src.utils.settings import settings
from src.models.model import responseModel
import random
import uuid


# --------------------------
# 로그인 로직 처리 함수 (원청사/협력사 공통 진입점)
# --------------------------
def loginProcess(response: Response, request: Request, loginModel):
    """
    [원청사] email → COMPANY 테이블 매칭 → 토큰 발급
    [협력사] email + authCode → Redis 코드 검증 → COMPANY 테이블 매칭 → 토큰 발급
    """
    try:
        email = loginModel.email
        loginType = loginModel.loginType  # "oem" | "supplier"
 
        # ── N차 협력사: 2차 인증 코드 검증 ──
        if loginType == "supplier":
            authCode = loginModel.authCode
            if not authCode:
                return responseModel(False, "인증 코드를 입력해 주세요.")
 
            # Redis에서 인증 코드 조회
            storedCode = client1.get(f"auth_code:{email}")
            if not storedCode:
                return responseModel(False, "인증 코드가 만료되었습니다. 다시 발송해 주세요.")
            if storedCode != authCode:
                return responseModel(False, "인증코드가 맞지 않습니다.")
 
            # 검증 성공 시 Redis에서 코드 삭제 (일회성)
            client1.delete(f"auth_code:{email}")
 
        # ── [v1.2] 원청사 로그인: tier=0 검증 (타 협력사 계정 차단) ──
        if loginType == "oem":
            oemCheckSql = """
                SELECT tier FROM `COMPANY`
                WHERE email = ? AND delete_yn = 0
            """
            oemCheck = findOne(oemCheckSql, (email,))
            if not oemCheck:
                return responseModel(False, "등록되지 않은 이메일입니다.")
            if int(oemCheck["tier"]) != 0:
                return responseModel(False, "원청사 전용 계정이 아닙니다. 협력사 로그인을 이용해 주세요.")
 
        # ── 공통: COMPANY 테이블에서 이메일 매칭 ──
        companySql = """
            SELECT partner_id, company_name, ceo_name, tier, tier_label,
                   email, country, size, status
            FROM `COMPANY`
            WHERE email = ? AND delete_yn = 0
        """
        company = findOne(companySql, (email,))
        if not company:
            return responseModel(False, "등록되지 않은 이메일이거나 비활성 기업입니다.")
 
        # ── 공통: 토큰 생성 (partner_id를 식별 ID로 사용) ──
        # [v1.1] dict로 전달 — Pydantic BaseModel은 JSON 직렬화 불가
        user = {
            "uuid": "",
            "id": company["partner_id"],
            "name": company["company_name"],
            "email": email,
            "role": company["tier_label"] or str(company["tier"]),
            "role_name": company["tier_label"] or "협력사",
        }
 
        accessToken, refreshToken, tokenUuid = createUserTokens(user)
 
        # ── refresh token DB 저장 (TOKEN 테이블) ──
        refreshTokenSql = """
            INSERT INTO `TOKEN` (`partner_id`, `refresh_token`, `uuid`)
            VALUES (?, ?, ?)
        """
        save(refreshTokenSql, (company["partner_id"], refreshToken, tokenUuid))
 
        # ── accessToken Redis 저장 ──
        setTokenRedis(tokenUuid, accessToken)
 
        # ── Cookie 설정 (세션 쿠키 — 브라우저 닫으면 자동 삭제) ──
        cookieDomain = _getDomain(request)
        response.set_cookie(
            key=settings.cookie_key,
            value=tokenUuid,
            domain=cookieDomain,
            httponly=True,
            samesite="lax",
            path="/",
        )
 
        # [v1.4] 세션 데이터 Redis 직접 저장 (GET /auth/me에서 JWE 복호화 없이 조회)
        import json as _json
        sessionData = {
            "partner_id": company["partner_id"],
            "company_name": company["company_name"],
            "tier": company["tier"],
            "tier_label": company.get("tier_label", ""),
            "email": email,
            "page": "dashboard" if int(company.get("tier", 1)) == 0 else "company_info",
        }
        client1.set(f"session:{tokenUuid}", _json.dumps(sessionData, ensure_ascii=False))
        client1.setex(f"page:{tokenUuid}", 86400, "dashboard" if int(company.get("tier", 1)) == 0 else "company_info")
 
        return responseModel(True, "로그인에 성공했습니다.", {
            "partner_id": company["partner_id"],
            "company_name": company["company_name"],
            "tier": company["tier"],
            "tier_label": company["tier_label"],
            "tokenUuid": tokenUuid,
        })
 
    except Exception as e:
        return responseModel(False, f"로그인 처리 중 오류가 발생했습니다: {str(e)}")
 
 
# --------------------------
# 2차 인증 코드 발송 함수 (N차 협력사 전용)
# --------------------------
def sendAuthCodeProcess(authCodeModel):
    """
    1. COMPANY 테이블에서 이메일 존재 여부 확인
    2. 6자리 난수 인증 코드 생성
    3. Redis에 저장 (TTL 5분)
    4. Kafka를 통해 이메일 발송
    """
    try:
        email = authCodeModel.email
 
        # 1. COMPANY 테이블에서 이메일 확인
        checkSql = """
            SELECT partner_id, company_name
            FROM `COMPANY`
            WHERE email = ? AND delete_yn = 0
        """
        company = findOne(checkSql, (email,))
        if not company:
            return responseModel(False, "등록되지 않은 이메일입니다.")
 
        # 2. 6자리 난수 인증 코드 생성
        code = str(random.randint(100000, 999999))
 
        # 3. Redis에 저장 (TTL 300초 = 5분)
        client1.setex(f"auth_code:{email}", 300, code)
 
        print("authCode: ", code)
 
        # 4. Kafka를 통해 이메일 발송
        kafkaData = {
            "type": 5,
            "email": email,
            "authCode": code,
            "companyName": company["company_name"],
        }
        sendToKafka(kafkaData)
 
        return responseModel(True, "인증 코드가 이메일로 발송되었습니다.")
 
    except Exception as e:
        return responseModel(False, f"인증 코드 발송 중 오류가 발생했습니다: {str(e)}")
 
 
# --------------------------
# 내부 헬퍼: 쿠키 도메인 추출
# --------------------------
def _getDomain(request: Request):
    """요청 도메인에서 쿠키 도메인 결정"""
    hostname = request.url.hostname
    if hostname and hostname.endswith(settings.domain):
        return f".{settings.domain}"
    return None
 
 
# --------------------------
# 로그아웃 처리 함수 (Redis + Cookie 초기화)
# --------------------------
def logoutProcess(response: Response, request: Request):
    """Redis 토큰 삭제 + Cookie 삭제"""
    try:
        # Cookie에서 tokenUuid 추출
        tokenUuid = request.cookies.get(settings.cookie_key, "")
        if tokenUuid:
            # Redis에서 토큰 + 세션 삭제
            from src.utils.rediscl import client1
            client1.delete(tokenUuid)
            client1.delete(f"session:{tokenUuid}")
            client1.delete(f"page:{tokenUuid}")
            # TOKEN 테이블에서 논리 삭제
            save("UPDATE `TOKEN` SET delete_yn = 1 WHERE uuid = ? AND delete_yn = 0", (tokenUuid,))
 
        # Cookie 삭제
        cookieDomain = _getDomain(request)
        response.delete_cookie(
            key=settings.cookie_key,
            domain=cookieDomain,
            path="/",
        )
        return responseModel(True, "로그아웃 되었습니다.")
    except Exception as e:
        return responseModel(False, f"로그아웃 처리 중 오류: {str(e)}")
    
 
 
# --------------------------
# [v1.2] 초대 링크 자동 로그인 (is_registered=0 → 프리패스)
# --------------------------
def inviteAutoLoginProcess(response, request, partnerId):
    """
    초대 URL 최초 접속 시 is_registered=0이면 2차 인증 없이 자동 로그인
    등록 완료(is_registered=1)이면 2차 인증 필수로 차단
    """
    try:
        # COMPANY에서 partner_id로 조회
        sql = """
            SELECT partner_id, company_name, ceo_name, email, tier, tier_label, is_registered
            FROM `COMPANY`
            WHERE partner_id = ? AND delete_yn = 0
        """
        company = findOne(sql, (partnerId,))
        if not company:
            return responseModel(False, "유효하지 않은 초대 링크입니다.", {"accessType": "not_found"})
 
        # 등록 완료 후 재접속 → 2차 인증 필수
        if int(company.get("is_registered", 0)) == 1:
            return responseModel(False, "등록이 완료된 기업입니다. 2차 인증 후 로그인해 주세요.", {
                "accessType": "require_auth",
                "email": company.get("email", ""),
            })
 
        # 최초 접속: 프리패스 자동 로그인 — 토큰 발급
        user = {
            "uuid": "",
            "id": company["partner_id"],
            "name": company["company_name"],
            "email": company.get("email", ""),
            "role": company.get("tier_label", "") or str(company.get("tier", "")),
            "role_name": company.get("tier_label", "") or "협력사",
        }
 
        accessToken, refreshToken, tokenUuid = createUserTokens(user)
 
        # refresh token DB 저장
        save(
            "INSERT INTO `TOKEN` (`partner_id`, `refresh_token`, `uuid`) VALUES (?, ?, ?)",
            (company["partner_id"], refreshToken, tokenUuid)
        )
 
        # accessToken Redis 저장
        setTokenRedis(tokenUuid, accessToken)
 
        # Cookie 설정 (세션 쿠키 — 브라우저 종료 시 자동 삭제)
        cookieDomain = _getDomain(request)
        response.set_cookie(
            key=settings.cookie_key, value=tokenUuid,
            domain=cookieDomain, httponly=True, samesite="lax",
            path="/",
        )
 
        # [v1.4] 세션 데이터 Redis 직접 저장
        import json as _json
        sessionData = {
            "partner_id": company["partner_id"],
            "company_name": company["company_name"],
            "tier": company["tier"],
            "tier_label": company.get("tier_label", ""),
            "email": company.get("email", ""),
            "page": "company_info",
        }
        client1.set(f"session:{tokenUuid}", _json.dumps(sessionData, ensure_ascii=False))
 
        return responseModel(True, "최초 접속 — 자동 로그인 완료", {
            "accessType": "free_pass",
            "partner_id": company["partner_id"],
            "company_name": company["company_name"],
            "tier": company["tier"],
            "tier_label": company.get("tier_label", ""),
            "tokenUuid": tokenUuid,
        })
 
    except Exception as e:
        return responseModel(False, f"초대 링크 처리 중 오류: {str(e)}")
 
# --------------------------
# [v1.4] 세션 조회 (FE 마운트 시 호출 — sessionStorage 대체)
# --------------------------
def getSessionProcess(request: Request):
    """
    httpOnly 쿠키의 tokenUuid → Redis session:{uuid} 직접 조회
    JWE 복호화 없이 단순 Redis GET으로 세션 데이터 반환 (안정성 확보)
    """
    try:
        # [v1.5] X-Token-UUID 헤더 우선, httpOnly 쿠키 폴백
        tokenUuid = request.headers.get("X-Token-UUID", "") or request.cookies.get(settings.cookie_key, "")
        if not tokenUuid:
            return responseModel(False, "", {"isLoggedIn": False})
 
        # Redis에서 세션 데이터 직접 조회
        import json as _json
        sessionRaw = client1.get(f"session:{tokenUuid}")
        if not sessionRaw:
            return responseModel(False, "", {"isLoggedIn": False})
 
        sessionData = _json.loads(sessionRaw)
        currentPage = client1.get(f"page:{tokenUuid}") or sessionData.get("page", "dashboard")
 
        return responseModel(True, "", {
            "isLoggedIn": True,
            "partner_id": sessionData.get("partner_id", ""),
            "company_name": sessionData.get("company_name", ""),
            "tier": sessionData.get("tier", 0),
            "tier_label": sessionData.get("tier_label", ""),
            "email": sessionData.get("email", ""),
            "page": currentPage,
        })
 
    except Exception as e:
        return responseModel(False, f"세션 조회 오류: {str(e)}", {"isLoggedIn": False})
 
 
# --------------------------
# [v1.4] 현재 페이지 저장 (새로고침 시 복원용)
# --------------------------
def savePageProcess(request: Request, pageData: dict):
    """메뉴 이동 시 현재 페이지를 Redis에 저장 (세션 쿠키 기반)"""
    try:
        # [v1.5] X-Token-UUID 헤더 우선
        tokenUuid = request.headers.get("X-Token-UUID", "") or request.cookies.get(settings.cookie_key, "")
        if not tokenUuid:
            return responseModel(False, "세션이 없습니다.")
 
        page = pageData.get("page", "dashboard")
        # Redis에 현재 페이지 저장 (TTL 24시간)
        client1.setex(f"page:{tokenUuid}", 86400, page)
 
        return responseModel(True, "")
    except Exception as e:
        return responseModel(False, f"페이지 저장 오류: {str(e)}")
 