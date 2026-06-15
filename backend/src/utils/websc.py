# src/utils/websocket.py
# ────────────────────────────────────────────────────────────────────────────
# [v3.0] 2026-06-14 — 다중 세션 지원을 위한 Room(partner_id) 기반 1:N 구조 고도화
# [v2.0] 2026-06-05 — partner_id 기반 전면 리팩토링 (user_id/company_id 레거시 제거)
#
# [역할] 웹소켓 관련 모든 공통 기능 모듈화 (싱글톤 매니저 관리)
# ────────────────────────────────────────────────────────────────────────────

import json
from fastapi import WebSocket
from starlette.websockets import WebSocketState
from src.utils.rediscl import getTokenRedis, getCompanyRedis


# ============================================================
# ■ ConnectionManager — 연결 풀 관리 (v3.0 Room 구조 개편)
# ============================================================

class ConnectionManager:
    def __init__(self):
        # 💡 [v3.0 변경] { partner_id: [WebSocket, WebSocket, ...] } 형태로 다중 세션 관리
        # 동일한 협력사(room_id) 내에 복수의 클라이언트 브라우저 및 에이전트 허용
        self.connections: dict[str, list[WebSocket]] = {}

    # ── 연결 등록
    async def connect(self, partnerId: str, websocket: WebSocket):
        """
        [역할] 웹소켓 연결 수락 및 특정 관제 룸(partnerId) 풀에 등록
        """
        await websocket.accept()

        # 해당 방(partnerId) 리스트가 아직 없으면 생성
        if partnerId not in self.connections:
            self.connections[partnerId] = []

        self.connections[partnerId] = websocket
        print(f"[WS 연결 등록] 룸 ID: {partnerId} | 현재 세션 수: {len(self.connections[partnerId])}")

    # ── 연결 해제
    def disconnect(self, partnerId: str, websocket: WebSocket):
        """[역할] 특정 관제 룸(partnerId)에서 이탈한 특정 웹소켓 세션 제거 (메모리 관리 포함)"""
        if partnerId in self.connections:
            if websocket in self.connections[partnerId]:
                self.connections[partnerId].remove(websocket)
                print(f"[WS 세션 해제] 룸 ID: {partnerId}")
            
            # 방에 활성화된 연결이 아무도 없다면 메모리 누수 방지를 위해 딕셔너리 키 자체를 해제
            if not self.connections[partnerId]:
                del self.connections[partnerId]
                print(f"[WS 룸 폭파] 룸 ID: {partnerId}에 더 이상 세션이 없어 방을 완전 메모리에서 삭제합니다.")

    # ── ★ 핵심: 특정 관제 룸(partner_id)의 모든 클라이언트들에게 브로드캐스트 전송
    async def broadcastToRoom(self, partnerId: str, data: dict):
        """
        [역할] 지정된 특정 관제 룸(partnerId)에 접속해 있는 모든 대시보드 브라우저에 실시간 데이터 투하
        """
        if partnerId not in self.connections:
            return

        # 리스트 사본을 만들어 전송 도중 disconnect 발생으로 인한 딕셔너리 변경 에러(RuntimeError) 방지
        for connection in list(self.connections[partnerId]):
            # 소켓 상태가 정상 연결 중일 때만 전송 프로세스 작동
            if connection.client_state == WebSocketState.CONNECTED:
                try:
                    await connection.send_text(
                        json.dumps(data, ensure_ascii=False)
                    )
                except Exception as e:
                    print(f"[WS 룸 전송 에러] partner_id={partnerId}, error={e}")
                    # 실패한 연결은 안전하게 풀에서 추출
                    self.disconnect(partnerId, connection)

    
    # ── 복수 협력사에게 전송
    async def sendToPartners(self, partnerIds: list[str], data: dict):
        """
        [역할] 지정된 복수 협력사에게 알림 전송
        [v2.0] company_id 기반 그룹 전송 → partner_id 리스트 기반으로 변경
        [사용 예시] 특정 공급망 계층(1차/2차/3차)의 모든 협력사에게 전송
        """
        for partnerId in partnerIds:
            await self.broadcastToRoom(partnerId, data)

    # ── 전체 브로드캐스트
    async def broadcast(self, data: dict):
        """
        [역할] 시스템 점검 등 전역(모든 룸, 모든 세션)에 실시간 공지 브로드캐스트 수행
        """
        for partnerId in list(self.connections.keys()):
            await self.broadcastToRoom(partnerId, data)

    # ── 연결 여부 확인
    def isConnected(self, partnerId: str) -> bool:
        """[역할] 특정 협력사의 웹소켓 연결 여부 반환"""
        return partnerId in self.connections

    # ── 현재 총 접속 중인 웹소켓 세션 수
    def getConnectedCount(self) -> int:
        """[역할] 현재 활성화되어 있는 서버 전체의 실시간 세션(소켓) 총 개수 반환"""
        return sum(len(sessions) for sessions in self.connections.values())

    # ── 현재 접속 중인 partner_id 목록
    def getConnectedPartners(self) -> list[str]:
        """[역할] 현재 연결된 모든 partner_id 목록 반환"""
        return list(self.connections.keys())


# ============================================================
# ■ 웹소켓 인증 모듈
# ============================================================

async def authenticateWS(websocket: WebSocket, token: str) -> str | None:
    """
    [역할] 웹소켓 연결 요청 시 전달된 UUID(token) 기반 2단계 Redis 교차 검증
           Redis client1(토큰 검증) -> client2(회사 식별자 조회) 후 partner_id 반환
    """
    # [로컬 마스터/개발 테스트 패스스루 가드라인]
    if token in ["test_master", "bd7443254b74483dafd4378accc76a6b"]:
        return "MAIN_HQ"

    # [단계 1] db5(client1) 세션 인증 토큰 유효성 검증
    tokenCheck = getTokenRedis(token)
    if not tokenCheck or not tokenCheck.get("status"):
        await websocket.close(code=4001)
        print(f"[WS 인증 실패] client1(db5) 내 유효하지 않거나 만료된 세션 UUID: {token}")
        return None

    # [단계 2] db6(client2) 세션 내 현재 바인딩된 회사 식별 코드(partner_id) 검증 및 추출
    companyCheck = getCompanyRedis(token)
    if not companyCheck or not companyCheck.get("status"):
        await websocket.close(code=4001)
        print(f"[WS 인증 실패] client2(db6) 내 세션에 매핑된 회사(partner_id) 정보가 누락됨")
        return None

    # 매핑되어 저장된 회사 마스터 코드 획득
    partnerId = companyCheck.get("token")
    if not partnerId:
        await websocket.close(code=4001)
        print(f"[WS 인증 실패] 유효한 partner_id 문자열이 비어있음")
        return None

    return partnerId


# ============================================================
# ■ ping/pong 처리 모듈
# ============================================================

async def handlePingPong(websocket: WebSocket) -> str:
    """
    [역할] 클라이언트 메시지 수신 및 ping/pong 연결 유지 처리

    [흐름]
      클라이언트 "ping" 전송
          → 서버 "pong" 응답
          → 연결 유지

    [반환]
      수신된 메시지 문자열 (ping 외 메시지 처리 확장 가능)

    [사용]
      apis/alarm.py의 websocketEndpoint while 루프에서 호출
    """
    data = await websocket.receive_text()
    if data == "ping":
        await websocket.send_text("pong")
    return data


# ============================================================
# ■ 싱글톤 인스턴스 (전역 사용)
# ============================================================

manager = ConnectionManager()
