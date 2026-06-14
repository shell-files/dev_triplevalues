from src.utils.settings import settings
import redis

# ------------------------------------------------------------------
# [v2.0] Redis Client 분리 저장 세션 격리 구조
# client1 (db5) : 유저 기본 인증 액세스 토큰 (accessToken) 저장 및 검증
# client2 (db6) : 유저가 선택하여 관제 중인 본사/원청사 식별 코드 (partner_id) 매핑
# ------------------------------------------------------------------

client1 = redis.Redis(
  host=settings.redis_host,
  port=settings.redis_port,
  db=settings.redis_db5,
  decode_responses=True
)
client2 = redis.Redis(
  host=settings.redis_host,
  port=settings.redis_port,
  db=settings.redis_db6,
  decode_responses=True
)

# --------------------------
# setTokenRedis: Token Redis(client1)에 값을 저장하는 함수
# --------------------------
def setTokenRedis(uuid: str, token: str):
    """Redis에 uuid를 키로, accessToken을 값으로 저장"""
    try:
        # set(key, value)
        client1.set(uuid, token)
        print(f"Success: Set Redis - uuid: {uuid}")
        return {"status": True}
    except Exception as e:
        print(f"Error setting Redis keys: {e}")
        return {"status": False}

# --------------------------
# getTokenRedis: Token Redis(client1)에서 저장된 값을 가져오는 함수
# --------------------------
def getTokenRedis(uuid: str):
    """uuid로 accessToken 조회"""
    try:
        result = client1.get(uuid)
        if result:
            return {"status": True, "uuid": uuid, "accessToken": result}
        return {"status": False, "message": "Key not found"}
    except Exception as e:
        print(f"Error getting Redis value: {e}")
        return {"status": False}

# --------------------------
# delTokenRedis: Token Redis(client1)에 저장된 값을 삭제하는 함수
# --------------------------
def delTokenRedis(uuid: str):
    """특정 uuid 키 삭제"""
    try:
        client1.delete(uuid)
        return {"status": True}
    except Exception as e:
        print(f"Error deleting Redis key: {e}")
        return {"status": False}

# --------------------------
# setCompanyRedis: Company Redis(client2)에 값을 저장하는 함수
# --------------------------
def setCompanyRedis(uuid: str, companyId: str):
    """Redis에 uuid를 키로, 선택한 회사 저장"""
    try:
        client2.set(uuid, companyId)
        return {"status": True}
    except Exception as e:
        print(f"Error setting Redis keys: {e}")
        return {"status": False}

# --------------------------
# getCompanyRedis: Company Redis(client2)에서 저장된 값을 가져오는 함수
# --------------------------
def getCompanyRedis(uuid: str):
    """ uuid로 회사 조회"""
    try:
        result = client2.get(uuid)
        if result:
            return {"status": True, "uuid": uuid, "token": result}
        return {"status": False, "message": "Key not found"}
    except Exception as e:
        print(f"Error getting Redis value: {e}")
        return {"status": False}

# --------------------------
# delCompanyRedis: Company Redis(client2)에 저장된 값을 삭제하는 함수
# --------------------------
def delCompanyRedis(uuid: str):
    """특정 uuid 키 삭제"""
    try:
        client2.delete(uuid)
        return {"status": True}
    except Exception as e:
        print(f"Error deleting Redis key: {e}")
        return {"status": False}