from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task1(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')
    
    sql = """
        SELECT 
            saa.id as answer_id,
            saa.partner_id,
            c.company_name,
            saa.indicator_no,
            saa.answer_text 
        FROM SELF_ASSESS_ANSWER AS saa
        LEFT OUTER JOIN COMPANY AS c
        ON saa.partner_id = c.partner_id
        WHERE saa.risk_level = %s 
        AND saa.delete_yn = %s
    """

    records = mysql_hook.get_records(sql, parameters=('평가중', 0,))

    json_data = [
        {
            "answerId": row[0],
            "partnerId": row[1],
            "companyName": row[2],
            "indicatorNo": row[3],
            "answerText": row[4],
        }
        for row in records
    ]

    ti = context['ti']
    ti.xcom_push(key='task1', value=json_data)
