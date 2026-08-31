from datetime import datetime
from airflow import DAG
from airflow.providers.standard.operators.empty import EmptyOperator
from airflow.providers.standard.operators.python import PythonOperator

# 1단계 모듈 임포트
from src.step01 import task1 as riskTask1
from src.step02 import task2 as riskTask2
from src.step03 import task3 as riskTask3
from src.step04 import task4 as riskTask4
from src.step05 import task5 as riskTask5
from src.step07 import task7 as riskTask7
from src.step08 import task8 as riskTask8
from src.step09 import task9 as riskTask9

# 2단계 모듈 임포트
from ai.step00 import task0 as aiTask0
from ai.step01 import task1 as aiTask1
from ai.step02 import task2 as aiTask2
from ai.step03 import task3 as aiTask3
from ai.step04 import task4 as aiTask4
from ai.step05 import task5 as aiTask5
from ai.step06 import task6 as aiTask6

with DAG(
    dag_id='integratedRiskAiPipeline',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False
) as dag:
    
    start = EmptyOperator(task_id='start')
    end = EmptyOperator(task_id='end')

    # ----------------------------------------------------
    # [1단계] 룰 엔진 및 실시간 경보 파이프라인
    # ----------------------------------------------------
    자가진단추출 = PythonOperator(
        task_id='AnswerExtraction',
        python_callable=riskTask1
    )

    룰추출 = PythonOperator(
        task_id='RuleExtraction',
        python_callable=riskTask2
    )

    리스크등급판별 = PythonOperator(
        task_id='riskGradeDecision',
        python_callable=riskTask3
    )

    리스크등급판별적재 = PythonOperator(
        task_id='loadAnswerRisk',
        python_callable=riskTask4
    )

    회사별리스크적재 = PythonOperator(
        task_id='loadCompanyRisk',
        python_callable=riskTask5
    )

    경고등 = PythonOperator(
        task_id='loadAlarmData',
        python_callable=riskTask7
    )

    알람전송 = PythonOperator(
        task_id='sendAlarm',
        python_callable=riskTask8
    )

    피드적재 = PythonOperator(
        task_id='loadAgentAlert',
        python_callable=riskTask9
    )

    # 중간 다리 역할 (1단계 완료 컴포넌트 격리 지점)
    룰엔진완료스테이징 = EmptyOperator(
        task_id='rule_engine_staging_complete')

    # ----------------------------------------------------
    # [2단계] 비동기 AI 심층 분석 파이프라인 (MariaDB Staging Layer 이후)
    # ----------------------------------------------------
    
    추론데이터수집 = PythonOperator(
        task_id='collectData',
        python_callable=aiTask0
    )

    데이터임베딩 = PythonOperator(
        task_id='embeddingData',
        python_callable=aiTask1
    )

    코사인유사도검색 = PythonOperator(
        task_id='denseRetrieval',
        python_callable=aiTask2
    )

    백터데이터가져오기 = PythonOperator(
        task_id='pullVectorData',
        python_callable=aiTask3
    )

    BM검색및RRF와RERANKER = PythonOperator(
        task_id='reranker',
        python_callable=aiTask4
    )

    프롬프트컬럼적재 = PythonOperator(
        task_id='loadPrompt',
        python_callable=aiTask5
    )

    AI추론및데이터적재 = PythonOperator(
        task_id='loadInferenceData',
        python_callable=aiTask6
    )

    # ----------------------------------------------------
    # 전과정 직렬 의존성 정의 (실시간 알림 완료 후 AI 분석으로 토스)
    # ----------------------------------------------------

    (
        start
        >> 자가진단추출
        >> 룰추출
        >> 리스크등급판별
        >> 리스크등급판별적재
        >> 회사별리스크적재 
        >> 경고등
        >> 피드적재
        >> 알람전송
        # 1단계 끝
        >> 룰엔진완료스테이징
        # 2단계 파이프라인 직렬 시작
        >> 추론데이터수집
        >> 데이터임베딩
        >> 코사인유사도검색
        >> 백터데이터가져오기
        >> BM검색및RRF와RERANKER
        >> 프롬프트컬럼적재
        >> AI추론및데이터적재
        >> end
    )