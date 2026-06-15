from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from starlette.websockets import WebSocketState
from typing import List, Dict
from pprint import pprint
import uvicorn

# 기존 유틸리티 임포트
from src.utils.websc import authenticateWS

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: str, data: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection.client_state == WebSocketState.CONNECTED:
                    try:
                        await connection.send_json(data)
                    except Exception:
                        pass

manager = ConnectionManager()

# 💡 URL에서 room_id를 받지 않고, 토큰 인증 결과로 생성
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # 1. 인증 로직 (partner_id 반환)
    partner_id = await authenticateWS(websocket, token)
    if not partner_id:
        return # 인증 실패 시 authenticateWS가 close 처리함

    # 2. 방(partner_id) 입장
    await manager.connect(partner_id, websocket)
    
    # [테스트] 연결 직후 브라우저에 메시지 전송 (Messages 탭 확인용)
    await manager.broadcast_to_room(partner_id, {
        "type": "SYSTEM",
        "message": f"성공! {partner_id}번 방에 연결되었습니다."
    })

    try:
        while True:
            data = await websocket.receive_json()
            pprint(f"수신 [{partner_id}]: {data}")
            
            # 메시지 처리 로직
            key = data.get('type', 'CHAT')
            await manager.broadcast_to_room(partner_id, {
                "type": key,
                "sender": data.get("sender", "Client"),
                "data": data.get("data")
            })
    except WebSocketDisconnect:
        pprint(f"[Info] {partner_id} 연결 종료")
    finally:
        manager.disconnect(partner_id, websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)