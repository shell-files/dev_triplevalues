from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task6(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')

    ti = context['ti']
    runId = ti.xcom_pull(task_ids='loadRunLog1', key='task0')
    compCriticalCount = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-critical')
    compHighCount = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-high')
    compMedium = ti.xcom_pull(task_ids='riskGradeDecision', key='task3-medium')

    sql = """
        UPDATE `AI_AGENT_RUN_LOG` SET 
            critical_count = %s, 
            fail_count = %s, 
            warn_count = %s
        WHERE run_id = %s
    """

    mysql_hook.run(sql, parameters=( compCriticalCount, compHighCount, compMedium, runId))
