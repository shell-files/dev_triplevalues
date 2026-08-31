from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task0(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    try:
        sql = """
            SELECT DISTINCT 
                aaa.alert_id, 
                aar.rule_name, 
                aaa.indicator_no,
                aar.operator,
                aar.threshold_value,
                saa.answer_text
            FROM AI_AGENT_ALERT AS aaa
            LEFT OUTER JOIN AI_AGENT_RULE aar
            ON (aaa.rule_id = aar.rule_id AND aar.active_yn = 0)
            LEFT OUTER JOIN SELF_ASSESS_ANSWER saa
            ON (aaa.indicator_no = saa.indicator_no 
            AND aaa.partner_id = saa.partner_id 
            AND saa.delete_yn = 0)
            WHERE ai_recommendation IS NULL            
        """

        records = mysql_hook.get_records(sql)

        jsonData = [
            {
                "alertId": row[0],
                "ruleName": row[1],
                "indicatorNo": row[2],
                "operator": row[3],
                "thresholdValue": row[4],
                "answerText": row[5],
            }
            for row in records
        ]

        ti = context['ti']
        ti.xcom_push(key='task0', value=jsonData)
    except Exception as e:
        pprint(f"❌ [마리아디비 오류]: {e}")