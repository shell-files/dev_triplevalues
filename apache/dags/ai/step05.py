from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task5(**context):
    ti = context['ti']
    # reranker 가 push 하지 못한 경우에도 안전하게 빈 목록으로 처리
    data = ti.xcom_pull(task_ids='reranker', key='task4') or []
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    conn = mysql_hook.get_conn()
    cursor = conn.cursor()

    try:
        sql = """
            UPDATE AI_AGENT_ALERT SET 
            prompt = %s
            WHERE alert_id = %s
        """
        for row in data:
            params = (row["prompt"], row["alertId"])
            cursor.execute(sql, params)
            conn.commit()
    except Exception as e:
        conn.rollback()
        pprint(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
