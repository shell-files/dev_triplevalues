from pprint import pprint
from airflow.models import Variable

def task1(**context):
    import ollama

    ti = context['ti']
    data = ti.xcom_pull(task_ids='collectData', key='task0')

    try:
        ollama_host = Variable.get("OLLAMA_HOST", default_var="http://localhost:11434")
        embed_model = Variable.get("OLLAMA_EMBED_MODEL", default_var="bge-m3:latest")

        ollamaClient = ollama.Client(ollama_host)
        list = []
        for rule in data:
            ruleName = rule['ruleName']
            indicatorNo = rule['indicatorNo']
            query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"
            # 설정의 임베딩 모델 가동 (Ollama 임베딩)
            res = ollamaClient.embeddings(model=embed_model, prompt=query)
            queryVector = res["embedding"]
            list.append(queryVector)
            

        ti.xcom_push(key='task1', value=list)
    except Exception as e:
        pprint(f"❌ [Ollama 임베딩 에러] Ollama 서버 연결 실패 혹은 모델 로드 지연: {e}")
        pprint("💡 조치 방법: 타임아웃 길이를 늘리거나, 'ollama serve'가 정상 작동 중인지 확인하세요.")