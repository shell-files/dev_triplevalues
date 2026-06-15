# src/apis/alarm.py
# ────────────────────────────────────────────────────────────────────────────
# [역할] HTTP/WebSocket 요청 수신 후 models/alarm.py에 위임
#        웹소켓 인증/ping/pong은 utils/websc.py 모듈 사용
# ────────────────────────────────────────────────────────────────────────────
from pprint import pprint
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, Query
from src.utils.websc import manager, authenticateWS, handlePingPong  # 모듈 import
from src.models.alarm import getAlarmListProcess, readAlarmProcess, deleteAlarmProcess, sendAlarmProcess
from src.models.model import alarmResponse, alarmListModel, alarmReadModel, alarmSendModel

router = APIRouter()


# ── WebSocket — 실시간 알림
@router.websocket("/ws")
async def alarmWebSocket(
    websocket  : WebSocket,
    token      : str = Query(...),
):
    print(f"DEBUG: [alarm.py] 웹소켓 진입 성공, 토큰: {token}")
    # 1. 연결 요청 수락 (가장 중요)
    await websocket.accept()

    # 2. 인증 처리
    partnerId = await authenticateWS(websocket, token)

    # 만약 인증이 실패한다면, 테스트를 위해 하드코딩된 partnerId를 부여할 수도 있습니다.
    if not partnerId and token == "3fc1aaa0f88a4c61ba25f41ac42d33a4":
        partnerId = "HMOS-001" # 테스트용 ID 강제 지정

    if not partnerId:
        print(f"[!] 웹소켓 인증 실패: 토큰 {token}에 대한 partnerId를 찾을 수 없습니다.")
        return

    # 2. 💡 [변경] 수락 및 룸 기반 세션 매니저 등록 프로세스 가동
    # 기존 단일 커넥션 매니저에서 룸 기반(Dict[str, List[WebSocket]]) 구조로 전환 적용
    await manager.connect(partnerId, websocket)
    
    # 해당 관제 룸 전체 사용자들에게 시스템 입장 브로드캐스트 발송
    await manager.broadcastToRoom(partnerId, {
        "type": "SYSTEM",
        "sender": "System",
        "message": f"[{partnerId}] 관제 콘솔 실시간 채널에 연결되었습니다."
    })
    pprint(f"웹소켓 활성화 관제 룸 ID: {partnerId}")

    try:
        while True:
            # 3. 비정상 소켓 연결 상태 선제 방어 가드 클로징
            if websocket.client_state != WebSocketState.CONNECTED:
                print(f"[Warning] {partnerId} 룸 소켓 상태가 정상 연결 상태가 아닙니다.")
                break
                
            # 4. utils/websc.py — 기존 시스템 핑퐁 유지를 위한 가드라인 처리
            await handlePingPong(websocket)
            
            # 5. Airflow 또는 연동 브라우저 측으로부터 수신 대기 (Non-blocking 수신 루프)
            # 수신 시 텍스트나 커스텀 데이터를 파싱하기 위한 준비 단계
            try:
                # 클라이언트 단에서 보낸 JSON 데이터를 캐치합니다. (필요 시 주석 해제하여 에이전트 커맨드 제어 가능)
                # data = await websocket.receive_json()
                # pprint(f"수신 [{partnerId}]: {data}")
                
                # 💡 Airflow Task 등 외부 에이전트가 완결 신호(CLOSE)를 주입했을 때의 브레이크 안전 장치
                # if data.get("type") == "CLOSE":
                #     print(f"[Info] 외부 Task로부터 작업 완료 신호(CLOSE) 수신. 루프를 안전하게 종료합니다.")
                #     break
                pass
            except Exception:
                # 수신 대기 중 에러 발생 시 루프를 유지하되 ping/pong 유실 방지 가드링
                pass
    except WebSocketDisconnect:
        pprint(f"[Info] {partnerId} 관제 룸 세션 연결이 브라우저에 의해 정상 종료되었습니다.")
        
    except RuntimeError as e:
        pprint(f"[Error] 런타임 에러 감지 (이미 닫힌 소켓 대상 작업 방지): {e}")
        
    finally:
        try:
            # 6. 💡 [변경] 해제할 때도 룸 정보와 해당 소켓을 정확히 파라미터로 넘겨 안전하게 제거 (메모리 누수 방지)
            manager.disconnect(partnerId, websocket)
            
            # 같은 관제 그룹 사용자들에게 퇴장 메시지 발송
            await manager.broadcastToRoom(partnerId, {
                "type": "SYSTEM",
                "sender": "System",
                "message": f"[{partnerId}] 관제 채널 연결이 해제되었습니다."
            })
        except ValueError:
            pass
        
# ── POST — 알림 목록 조회
@router.post("",
    summary="알림 목록 조회",
    response_model=alarmResponse,
    description="알람 목록 조회")

def getAlarms(
    alarmListModel : alarmListModel,
    partnerId      : str = Header(..., alias="PartnerId"),
):
    return getAlarmListProcess(alarmListModel, partnerId)


# ── PATCH — 알림 읽음 처리
@router.patch("",
    summary="알림 읽음 처리",
    response_model=alarmResponse,
    description="개별 또는 전체 알람을 읽음 상태로 변경")

def patchAlarm(
    alarmReadModel : alarmReadModel,
    partnerId      : str = Header(..., alias="PartnerId"),
):
    return readAlarmProcess(alarmReadModel, partnerId)


# ── DELETE — 알림 삭제
@router.delete("/{alarmId}",
    summary="알림 삭제",
    response_model=alarmResponse,
    description="알림 목록 삭제")

def alarmDel(
    alarmId   : int,
    uuid      : str = Query(..., description="Redis uuid"),
):
    return deleteAlarmProcess(alarmId, uuid)


# ── POST — 알림 전송
@router.post("/send",
    summary="알림 전송",
    response_model=alarmResponse,
    description="단일 알림 전송")

async def sendAlarm(alarmSendModel: alarmSendModel):
    return await sendAlarmProcess(alarmSendModel)
