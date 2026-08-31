from datetime import datetime
from airflow import DAG
from airflow.providers.standard.operators.empty import EmptyOperator
from airflow.providers.standard.operators.python import PythonOperator
from ai.step00 import task0
from ai.step01 import task1
from ai.step02 import task2
from ai.step03 import task3
from ai.step07 import task7
from ai.step08 import task8
from ai.step09 import task9


with DAG(
    dag_id='ai_benchmark',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False
) as dag:
    
    start = EmptyOperator(task_id ='start')
    end = EmptyOperator(task_id = 'end')

    추론데이터수집 = PythonOperator(
        task_id='collectData',
        python_callable=task0
    )
    
    데이터임베딩 = PythonOperator(
        task_id='embeddingData',
        python_callable=task1
    )
    
    코사인유사도검색 = PythonOperator(
        task_id='denseRetrieval',
        python_callable=task2
    )
    
    벡터데이터가져오기 = PythonOperator(
        task_id='pullVectorData',
        python_callable=task3
    )
    
    # 정확도대조평가1 = PythonOperator(
    #     task_id='ContrastiveEvaluation',
    #     python_callable=task7
    # )
    
    # 정확도대조평가2 = PythonOperator(
    #     task_id='selectTopOne',
    #     python_callable=task8
    # )
    
    정확도대조평가3 = PythonOperator(
        task_id='manualComparison',
        python_callable=task9
    )

    (
        start
        >> 추론데이터수집
        >> 데이터임베딩 
        >> 코사인유사도검색
        >> 벡터데이터가져오기
        # >> 정확도대조평가1
        # >> 정확도대조평가2
        >> 정확도대조평가3
        >> end
    )


