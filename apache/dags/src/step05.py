from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task5(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')

    ti = context['ti']
    list = ti.xcom_pull(task_ids='riskGradeDecision', key='task3')
    compCriticalCount = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-critical')
    compHighCount = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-high')

    for row in list:
        partnerId = row["partnerId"]
        companyRisk = "저위험"

        sql = """
            UPDATE `COMPANY` SET risk_level = %s WHERE partner_id = %s AND delete_yn = 0
        """

        if compCriticalCount >= 1:
            companyRisk = "고위험"    # CRITICAL이 단 1개라도 있으면 무조건 고위험
        elif compHighCount >= 1:
            companyRisk = "중위험"    # CRITICAL은 없지만 HIGH가 1개라도 있으면 중위험

        mysql_hook.run(sql, parameters=(companyRisk, partnerId))
