import asyncio  # 💡 추가 필수
import threading
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from starlette.websockets import WebSocketState
from typing import List, Dict
from pprint import pprint
from kafka import KafkaConsumer
from src.utils.websc import authenticateWS

app = FastAPI()

# 💡 manager를 최상단으로 이동하여 스레드에서 접근 가능하게 함
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
                    except Exception as e:
                        print(f"전송 실패: {e}")

manager = ConnectionManager() # 이동 완료

def kafka_consumer_thread():
    print("🚀 Kafka 컨슈머 스레드 시작")
    consumer = KafkaConsumer(
        'alarm-topic',
        bootstrap_servers='localhost:9092',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    for message in consumer:
        raw_msg = message.value  # 에어플로우가 보낸 {'type': 'tv', 'sender': 'airflow', 'data': {...}, 'partner_id': '...'}
        
        partner_id = raw_msg.get("partner_id")
        
        # 💡 프론트엔드 규격에 맞춘 재가공
        # 에어플로우의 'type'과 'data'를 그대로 활용하여 패키징
        processed_data = {
            "type": raw_msg.get("type", "tv"),
            "sender": raw_msg.get("sender", "System"),
            "data": raw_msg.get("data") # 여기에 에어플로우의 실질적인 데이터가 담김
        }
        
        print(f"📩 Kafka 데이터 수신 및 재가공: {processed_data}")
        
        if partner_id in manager.active_connections:
            # 비동기 전송 실행
            asyncio.run(manager.broadcast_to_room(partner_id, processed_data))
        else:
            print(f"❌ 방 {partner_id}가 연결 목록에 없음.")

@app.on_event("startup")
async def startup_event():
    threading.Thread(target=kafka_consumer_thread, daemon=True).start()

# 💡 URL에서 room_id를 받지 않고, 토큰 인증 결과로 생성
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # 1. 인증 로직 (partner_id 반환)
    partner_id = await authenticateWS(websocket, token)
    if not partner_id:
        return # 인증 실패 시 authenticateWS가 close 처리함

    # 2. 방(partner_id) 입장
    await manager.connect(partner_id, websocket)
    print(f"✅ 클라이언트 연결됨! 등록된 방 ID: '{partner_id}' (타입: {type(partner_id)})")
    print(f"현재 전체 방 목록: {list(manager.active_connections.keys())}")
    
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