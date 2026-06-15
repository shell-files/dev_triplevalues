# test_kafka_publish.py (별도 파일로 생성 후 실행)
import json
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers='localhost:9092', # Kafka 서버 주소
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# [중요] 연결 성공한 partner_id(예: HMOS-001)를 정확히 입력하세요
data = {
    "partner_id": "HMOS-001", 
    "type": "tv", 
    "data": {"msg": "테스트 알림 메시지입니다."}
}

producer.send('alarm-topic', value=data)
producer.flush()
print("메시지 발행 완료!")