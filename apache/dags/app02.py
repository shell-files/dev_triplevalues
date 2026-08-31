from datetime import datetime
from airflow import DAG
from airflow.providers.standard.operators.empty import EmptyOperator
from airflow.providers.standard.operators.python import PythonOperator
from ai.step00 import task0
from ai.step01 import task1
from ai.step02 import task2
from ai.step03 import task3
from ai.step04 import task4
from ai.step05 import task5
from ai.step06 import task6
from ai.step10 import task10
from ai.step11 import task11


with DAG(
    dag_id='aiExample',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False
) as dag:
    
    start = EmptyOperator(task_id='start')
    end = EmptyOperator(task_id='end')
    
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

    백터데이터가져오기 = PythonOperator(
        task_id='pullVectorData',
        python_callable=task3
    )

    BM검색및RRF와RERANKER = PythonOperator(
        task_id='reranker',
        python_callable=task4
    )

    프롬프트컬럼적재 = PythonOperator(
        task_id='loadPrompt',
        python_callable=task5
    )

    AI추론및데이터적재 = PythonOperator(
        task_id='loadInferenceData',
        python_callable=task6
    )

    AI알람정보 = PythonOperator(
        task_id='alarmData',
        python_callable=task10
    )
    
    AI알람전송 = PythonOperator(
        task_id='sendAiAlarm',
        python_callable=task11
    )


    (
        start
        >> 추론데이터수집
        >> 데이터임베딩 
        >> 코사인유사도검색
        >> 백터데이터가져오기
        >> BM검색및RRF와RERANKER
        >> 프롬프트컬럼적재
        >> AI추론및데이터적재
        >> AI알람정보
        >> AI알람전송
        >> end
    )
