from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task9(**context):
    ti = context['ti']
    data = ti.xcom_pull(task_ids='riskGradeDecision', key='task3')
    alarmId = ti.xcom_pull(task_ids='loadAlarmData', key='alarmId')

    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    conn = mysql_hook.get_conn()
    cursor = conn.cursor()

    try:

        for item in data:
            partnerId = item['partnerId']
            indicatorNo = item['indicatorNo']
            ruleId = item['ruleId']
            currentItemRisk = item['currentItemRisk']
            params = (partnerId, indicatorNo, ruleId, alarmId, currentItemRisk)

            sql = """
                INSERT INTO AI_AGENT_ALERT 
                    (partner_id, indicator_no, rule_id, alarm_id, severity)
                VALUE
                    (%s, %s, %s, %s, %s)
            """
            pprint(params)
            cursor.execute(sql, params)
            conn.commit()

    except Exception as e:
        conn.rollback()
        pprint(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

