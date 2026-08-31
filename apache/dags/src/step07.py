from pprint import pprint
from collections import Counter
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task7(**context):
    ti = context['ti']
    data = ti.xcom_pull(task_ids='riskGradeDecision', key='task3')
    totalAlertsGenerated = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-total')

    if not data:
        print("⚠️ XCom으로부터 가져온 데이터('task3')가 비어있습니다.")
        ti.xcom_push(key='total', value=0)
        return

    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    conn = mysql_hook.get_conn()
    cursor = conn.cursor()

    try:
      
        title = f'자가진단 AI 체크 1차 총 {totalAlertsGenerated}건이 결정되었습니다.'
        content = '현재 AI 진단 체크 2차는 분석중이며, 분석하는데 10분이 소요됩니다.\n분석이 완료되면 AI Agent 리스크 실시간 알림 피드 상세화면에 보내드리겠습니다.'

        company_counts = Counter(item["companyName"] for item in data)

        list = [
            {
                "companyName": comp_name,
                "count": count
            }
            for comp_name, count in company_counts.items()
        ]

        for company in list:
            message = f"{company['companyName']} : {company['count']}건"
            content += '\n'+ message

        params = (title, content)
        result = {
            "title": title,
            "content": content
        }

        sql = """
            INSERT INTO `ALARM` 
                (partner_id, type, level, title, content) 
            VALUES 
                ('HMOS-001', 'RISK', 'warn', %s, %s)
        """

        cursor.execute(sql, params)
        alarmId = cursor.lastrowid
        conn.commit()

        ti.xcom_push(key='alarm_data', value=result)
        ti.xcom_push(key='alarmId', value=alarmId)
    except Exception as e:
        conn.rollback()
        pprint(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
