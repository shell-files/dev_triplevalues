from pprint import pprint
from airflow.providers.postgres.hooks.postgres import PostgresHook
from ai.aicommon import simpleTokenizer

def task3(**context):
    postgres_hook = PostgresHook(postgres_conn_id='Vector')
    ti = context['ti']

    try:
        sql = "SELECT id, content, file_name, page_no FROM esg_pdf_vectors"

        df = postgres_hook.get_pandas_df(sql)
        rows = df.to_dict(orient='records')
        globalChunksPool = []
        corpus = []
        
        for r in rows:
            chunk = {
                "id": r["id"],
                "content": r["content"],
                "meta": {
                    "file_name": r["file_name"], 
                    "page_no": r["page_no"]
                }
            }
            globalChunksPool.append(chunk)
            corpus.append(simpleTokenizer(r["content"]))

        if globalChunksPool:
            # 안전하게 일반 print로 텍스트 출력
            print(f"✅ [하이브리드 인프라] 마스터 검색 데이터 풀 빌드 완수 (총 {len(globalChunksPool)}개 청크 및 벡터 로드 완료)")
            
        ti.xcom_push(key='task3-chunksPool', value=globalChunksPool)
        ti.xcom_push(key='task3-corpus', value=corpus)
    except Exception as e:
        pprint(f"❌ [pgvector 룩업 오류]: {e}")
