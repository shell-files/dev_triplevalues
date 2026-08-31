from airflow import DAG
from airflow.providers.standard.operators.empty import EmptyOperator
from airflow.providers.standard.operators.python import PythonOperator
from datetime import datetime
from src.step00 import task0
from src.step01 import task1
from src.step02 import task2
from src.step03 import task3
from src.step04 import task4
from src.step05 import task5
from src.step06 import task6
from src.step07 import task7
from src.step08 import task8
from src.step09 import task9

with DAG(
    dag_id='riskExample',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False
) as dag:
    start = EmptyOperator(task_id='start')
    end = EmptyOperator(task_id='end')
    
    # 작업로그생성 = PythonOperator(
    #     task_id='loadRunLog1',
    #     python_callable=task0
    # )

    자가진단추출 = PythonOperator(
        task_id='AnswerExtraction',
        python_callable=task1
    )

    룰추출 = PythonOperator(
        task_id='RuleExtraction',
        python_callable=task2
    )

    리스크등급판별 = PythonOperator(
        task_id='riskGradeDecision',
        python_callable=task3
    )

    리스크등급판별적재 = PythonOperator(
        task_id='loadAnswerRisk',
        python_callable=task4
    )

    회사별리스크적재 = PythonOperator(
        task_id='loadCompanyRisk',
        python_callable=task5
    )

    # 실행로그적재 = PythonOperator(
    #     task_id='loadRunLog2',
    #     python_callable=task6
    # )

    경고등 = PythonOperator(
        task_id='loadAlarmData',
        python_callable=task7
    )

    알람전송 = PythonOperator(
        task_id='sendAlarm',
        python_callable=task8
    )

    피드적재 = PythonOperator(
        task_id='loadAgentAlert',
        python_callable=task9
    )


    (
        start
        # 작업로그생성 
        >> 자가진단추출 
        >> 룰추출 
        >> 리스크등급판별 
        >> 리스크등급판별적재 
        >> 회사별리스크적재 
        # >> 실행로그적재
        >> 경고등
        >> 피드적재
        >> 알람전송
        >> end
    )
