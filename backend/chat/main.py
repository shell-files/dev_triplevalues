from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from typing import List, Dict
from pprint import pprint

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        # 💡 변경: { room_id: [WebSocket, WebSocket, ...] } 구조로 관리
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
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    # 1. 특정 방으로 접속 처리
    await manager.connect(room_id, websocket)
    
    # 같은 방(room_id) 사용자들에게만 입장 알림
    await manager.broadcast_to_room(room_id, {
        "type": "SYSTEM",
        "sender": "System",
        "message": f"[{room_id}번 방] 입장하셨습니다."
    })
    pprint(f"방 ID: {room_id}")

    try:
        while True:
            if websocket.client_state != WebSocketState.CONNECTED:
                print(f"[Warning] {room_id} 방 소켓 상태가 연결 상태가 아닙니다.")
                break
                
            data = await websocket.receive_json()
            pprint(f"송신 [{room_id}]: {data}")

            # 💡 [추가] Airflow Task가 전송 완료 후 보낸 종료 신호 처리
            if data.get("type") == "CLOSE":
                print(f"[Info] Task로부터 작업 완료 신호(CLOSE) 수신. 안전하게 소켓을 닫습니다.")
                break  # 루프를 탈출하여 finally 블록으로 이동시킵니다.
            
            key = "CHAT"
            if data.get('type') == 'tv':
                key = data.get('type')

            # 2. 메세지도 전체 전송이 아닌 같은 방 유저들에게만 발송
            await manager.broadcast_to_room(room_id, {
                "type": key,
                "sender": data.get("sender"),
                # "message": data.get("message"),
                "data": data.get("data")
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
