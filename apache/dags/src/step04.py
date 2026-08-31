from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task4(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')

    ti = context['ti']
    list = ti.xcom_pull(task_ids='riskGradeDecision', key='task3')

    for row in list:
        currentItemRisk = row["currentItemRisk"]
        answerId = row["answerId"]

        sql = """
            UPDATE `SELF_ASSESS_ANSWER` SET risk_level = %s WHERE id = %s
        """
        mysql_hook.run(sql, parameters=(currentItemRisk, answerId))
