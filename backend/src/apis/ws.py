from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, HTTPException
from starlette.websockets import WebSocketState
from src.utils.settings import settings
from typing import List, Dict
from pprint import pprint

router = APIRouter()

async def get_cookie_auth(websocket: WebSocket):
    headers = websocket.headers
    cookies = websocket.cookies
    token_uuid = headers.get("X-Token-UUID") or cookies.get(settings.cookie_key)
    if not token_uuid:
        # 쿠키가 없거나 올바르지 않으면 연결 거부
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=403, detail="인증되지 않은 사용자입니다.")
    return token_uuid

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        """특정 방(room_id)에 클라이언트 연결 수락 및 저장"""
        await websocket.accept()

        # 해당 방이 아직 딕셔너리에 없다면 리스트 생성
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        """특정 방에서 연결이 끊긴 클라이언트 제거"""
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

            # 방에 아무도 없다면 메모리 관리를 위해 방 자체를 삭제
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: str, data: dict):
        """★중요: 특정 방(room_id)에 접속중인 클라이언트들에게만 데이터 전송"""
        if room_id not in self.active_connections:
            return

        for connection in self.active_connections[room_id]:
            if connection.client_state == WebSocketState.CONNECTED:
                try:
                    await connection.send_json(data)
                except Exception:
                    pass

manager = ConnectionManager()

# 주소 구조를 변경: /ws/{room_id}
@router.websocket("/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token_uuid: str = Depends(get_cookie_auth)):

    print(f"[Info] 방 ID: {room_id}, {token_uuid}")

    # 1. 특정 방으로 접속 처리
    await manager.connect(room_id, websocket)

    try:
        # 2. 메세지 전송
        await manager.broadcast_to_room(room_id, {
            "type": "SYSTEM",
            "sender": "System",
            "data": f"[{room_id}] 사용자 알림"
        })
    except WebSocketDisconnect:
        pprint(f"[Info] {room_id} 방 연결을 정상적으로 종료했습니다.")

    except RuntimeError as e:
        pprint(f"[Error] 런타임 에러 발생 (이미 끊긴 소켓): {e}")

    finally:
        try:
            # 3. 해제할 때도 방 정보를 넘겨서 안전하게 제거
            manager.disconnect(room_id, websocket)

            await manager.broadcast_to_room(room_id, {
                "type": "SYSTEM",
                "sender": "System",
                "message": f"[{room_id}번 방] 퇴장하셨습니다."
            })
        except ValueError:
            pass

# 주소 구조를 변경: /ws/airflow/{room_id}
@router.websocket("/airflow/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    # 1. 특정 방으로 접속 처리
    await manager.connect(room_id, websocket)

    try:
        # 같은 방(room_id) 사용자들에게만 입장 알림
        await manager.broadcast_to_room(room_id, {
            "type": "AIRFLOW",
            "sender": "System",
            "message": f"airflow 알림"
        })
        pprint(f"방 ID: {room_id}")

        # ★★★ 이 루프가 없으면 open 되자마자 바로 closed 됩니다! ★★★
        while True:
            # 클라이언트로부터 메시지를 수신 대기하며 연결을 유지합니다.
            data = await websocket.receive_text()

    except WebSocketDisconnect:
        pprint(f"[Info] {room_id} 방 연결을 정상적으로 종료했습니다.")

    except RuntimeError as e:
        pprint(f"[Error] 런타임 에러 발생 (이미 끊긴 소켓): {e}")

    finally:
        try:
            # 3. 해제할 때도 방 정보를 넘겨서 안전하게 제거
            manager.disconnect(room_id, websocket)

            await manager.broadcast_to_room(room_id, {
                "type": "AIRFLOW",
                "sender": "System",
                "message": f"[{room_id}번 방] 퇴장하셨습니다."
            })
        except ValueError:
            pass
