from pprint import pprint
import json
from websocket import create_connection
from airflow.models import Variable

def sendWebsocketAlarm(messageDict):
    """
    지정된 웹소켓 서버 주소로 JSON 데이터를 전송하는 공통 함수
    """
    # 본인의 웹소켓 서버 주소 (예: Node.js, FastAPI, Slack 등)
    wsUrl = Variable.get("WS_HOST", default_var="ws://tval.weareithero.cloud/ws/airflow/HMOS-001")

    try:
        # 웹소켓 연결 오픈
        ws = create_connection(wsUrl)
        
        # 딕셔너리 데이터를 JSON 문자열로 변환하여 전송
        ws.send(json.dumps(messageDict, ensure_ascii=False))
        # ws.send(message_dict)
        print(f" WebSockets 알람 전송 성공: {messageDict}")
        
        # 연결 닫기
        ws.close()
    except Exception as e:
        print(f"❌ WebSockets 알람 전송 실패: {e}")

def task11(**context):
    """
    Airflow 태스크 실패 시 호출될 콜백 함수
    """
    ti = context['task_instance']
    data = ti.xcom_pull(task_ids='t10', key='alarmData')

    # 웹소켓 서버로 보낼 에러 정보 포맷팅
    payload = {
        "type": 'AIRFLOW',
        "sender": 'System',
        "data": data
    }
    sendWebsocketAlarm(payload)
