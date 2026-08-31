from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task2(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')

    sql = """
        SELECT 
        ar.rule_id,
        ar.indicator_no,
        ar.sub_id,
        ar.rule_name,
        ar.tier_scope,
        ar.metric_key,
        ar.operator,
        ar.threshold_value, 
        ar.fail_threshold,
        ar.severity,
        ar.action_required
    FROM AI_AGENT_RULE AS ar
    WHERE ar.active_yn = 0
    """

    records = mysql_hook.get_records(sql)

    json_data = [
        {
            "ruleId": row[0],
            "indicatorNo": row[1],
            "subId": row[2],
            "ruleName": row[3],
            "tierScope": row[4],
            "metricKey": row[5],
            "operator": row[6],
            "thresholdValue": row[7],
            "failThreshold": row[8],
            "severity": row[9],
            "actionRequired": row[10]
        }
        for row in records
    ]

    ti = context['ti']
    ti.xcom_push(key='task2', value=json_data)
