from pprint import pprint
from airflow.providers.postgres.hooks.postgres import PostgresHook

def task2(**context):
    """데이터를 조회하여 로그에 출력하는 함수"""
    postgres_hook = PostgresHook(postgres_conn_id='Vector')

    ti = context['ti']
    data = ti.xcom_pull(task_ids='embeddingData', key='task1')

    list = []
    try:
        for queryVector in data:
            sql = """
                SELECT id, content, file_name, page_no, (embedding <=> %s::vector) as distance
                FROM esg_pdf_vectors
                ORDER BY distance ASC
                LIMIT 20
            """

            df = postgres_hook.get_pandas_df(sql, parameters=(queryVector,))
            records = df.to_dict(orient='records')
            list.append(records)

        ti.xcom_push(key='task2', value=list)
    except Exception as e:
        pprint(f"❌ [pgvector 룩업 오류]: {e}")