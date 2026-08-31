from pprint import pprint
from collections import Counter
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task10(**context):
    ti = context['ti']
    totalAlertsGenerated = ti.xcom_pull(task_ids='loadInferenceData', key='task6-total')


    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    conn = mysql_hook.get_conn()
    cursor = conn.cursor()

    try:
      
        title = f'자가진단 AI 체크 2차 총 {totalAlertsGenerated}건이 분석되었습니다.'
        content = '현재 AI Agent 리스크 실시간 알림 피드 상세화면에 내용이 추가 되었습니다.\n 확인 및 조치 완료로 숨기기 가능합니다\n 숨기시더라도 내용은 리스크 현황 탭에서 다시 보실수 있습니다.'

        params = (title, content)
        result = {
            "title": title,
            "content": content
        }

        sql = """
            INSERT INTO `ALARM` 
                (partner_id, type, level, title, content) 
            VALUES 
                ('HMOS-001', 'AI_AGENT', 'info', %s, %s)
        """

        cursor.execute(sql, params)
        alarmId = cursor.lastrowid
        conn.commit()

        ti.xcom_push(key='alarmData', value=result)
        ti.xcom_push(key='alarmId', value=alarmId)
    except Exception as e:
        conn.rollback()
        pprint(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
