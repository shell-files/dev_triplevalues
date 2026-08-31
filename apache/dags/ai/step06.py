from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook
from airflow.models import Variable
import json

def findOllama(data):
    from ollama import Client

    try:
        ollama_host = Variable.get("OLLAMA_HOST", default_var="http://localhost:11434")
        ai_model = Variable.get("AI_MODEL", default_var="gemma4:e2b")

        client = Client(host=ollama_host)
        totalAlertsGenerated = 0
        resultList = []  # 💡 'list'는 파이썬 예약어이므로 변수명을 바꿉니다.
        for rule in data:
            alertId = rule['alertId']
            prompt = rule['prompt'] +"""
                [요청 사항]
                당신은 대한민국 대기업 공급망 관리 부서의 최고 엄격한 ESG 수석 감사관입니다. 
                제공된 글로벌 규제 문서 융합 컨텍스트와 위반 정황을 대조하여, 협력사가 범한 구체적인 위험도 분석 및 글로벌 실사법 상의 리스크 해소 권고안을 격식 있고 전문적인 한국어로 도출하여 아래 JSON 양식으로만 답변하십시오. 

                [출력 형식]
                마크다운 기호(```json)는 절대 포함하지 말고 순수 JSON 오브젝트만 반환하십시오.

                {{
                "alert_title": "위반 지표 명칭 기반 요약 알람 제목",
                "alert_content": "글로벌 가이드라인 기준 대비 협력사의 구체적인 위반 현황 경고문",
                "regulation": "CSDDD / EU REACH / 핵심 실사법 명칭 명시",
                "ai_confidence": 0.95,
                "ai_reasoning": "왜 이것이 글로벌 규제 관점에서 심각한 위반인지에 대한 명확한 논리적 근거 설명",
                "ai_recommendation": "협력사가 리스크를 즉시 해소하기 위해 이행해야 할 단계별 실천 조치 로드맵"
                }}
            """

            # 설정의 임베딩 모델 가동 (Ollama 임베딩)
            res = client.chat(
                model=ai_model, 
                messages=[
                    {'role': 'user','content': prompt,}
                ],
                format='json',
                options={
                    'temperature': 0
                }
            )
            result = {
                "alertId": alertId,
                "aiResp": json.loads(res.message.content)
            }
            resultList.append(result)
            totalAlertsGenerated += 1
        return resultList, totalAlertsGenerated
    except Exception as e:
        pprint(f"❌ [Ollama 임베딩 에러] Ollama 서버 연결 실패 혹은 모델 로드 지연: {e}")
        pprint("💡 조치 방법: 타임아웃 길이를 늘리거나, 'ollama serve'가 정상 작동 중인지 확인하세요.")
        return [], 0

def task6(**context):
    ti = context['ti']
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    conn = mysql_hook.get_conn()
    cursor = conn.cursor()
    try:
        sql = """
            SELECT 
                `alert_id`, `prompt`
            FROM AI_AGENT_ALERT
            WHERE `delete_yn` = 0 AND (`ai_reasoning`IS NULL OR `ai_recommendation` IS NULL)
        """

        # targetAlertId = 115
        # records = mysql_hook.get_records(sql, (targetAlertId,))
        records = mysql_hook.get_records(sql)

        jsonData = [
            {
                "alertId": row[0],
                "prompt": row[1]
            }
            for row in records
        ]

        ollamaResults, totalAlertsGenerated = findOllama(jsonData)
        sql = """
            UPDATE AI_AGENT_ALERT SET 
            ai_confidence = %s ,
            ai_reasoning = %s ,
            ai_recommendation = %s
            WHERE alert_id = %s
        """
        # LLM 이 필드를 배열/객체로 반환하면 SQL 파라미터에서 1241 오류가 나므로 스칼라로 정규화
        def toScalar(value):
            if isinstance(value, (dict, list)):
                return json.dumps(value, ensure_ascii=False)
            return value

        for row in ollamaResults:
            aiResp = row["aiResp"]
            params = (
                toScalar(aiResp.get("ai_confidence")),
                toScalar(aiResp.get("ai_reasoning")),
                toScalar(aiResp.get("ai_recommendation")),
                row["alertId"],
            )
            cursor.execute(sql, params)
            conn.commit()

        ti.xcom_push(key='task6-total', value=totalAlertsGenerated)
        pprint(f"💡 [마리아디비 완료]")
    except Exception as e:
        conn.rollback()
        pprint(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
