from pprint import pprint
from airflow.providers.mysql.hooks.mysql import MySqlHook

def task0(**context):
    mysql_hook = MySqlHook(mysql_conn_id='mariadb_conn_id')

    sql = """
        INSERT INTO `AI_AGENT_RUN_LOG` (status) VALUES ('RUNNING')
    """

    conn = mysql_hook.get_conn()
    cursor = conn.cursor()
    
    try:
        cursor.execute(sql)
        inserted_pk = cursor.lastrowid # 이전 생성한 pk키 변수 만들기
        conn.commit()
        print(f"🎉 INSERT 성공! 생성된 PK ID: {inserted_pk}")
        
        ti = context['ti']
        ti.xcom_push(key='task0', value=inserted_pk)
    except Exception as e:
        conn.rollback()
        print(f"❌ 데이터베이스 작업 중 에러 발생: {e}")
        raise e
    finally:
        # 6. 사용한 커서와 연결은 반드시 닫아줍니다.
        cursor.close()
        conn.close()
