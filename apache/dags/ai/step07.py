import numpy as np
from airflow.models import Variable
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from ai.aicommon import simpleTokenizer, safePrint

from ai.step04 import sparseSearch, reciprocalRank, chunkMapping

def task7(**context):
    try:
        ti = context['ti']
        data = ti.xcom_pull(task_ids='collectData', key='task0')
        pgvectorChunks = ti.xcom_pull(task_ids='denseRetrieval', key='task2') # 각 쿼리별 Top-20 리스트의 리스트
        globalChunksPool = ti.xcom_pull(task_ids='pullVectorData', key='task3-chunksPool')
        corpus = ti.xcom_pull(task_ids='pullVectorData', key='task3-corpus')

        # 🚨 [안전 장치 1] XCom 데이터 수집 검증 및 방어 로직
        if data is None:
            safePrint("⚠️ [에러] collectData 태스크로부터 분석 대상 데이터를 가져오지 못했습니다. (None)")
            return
        if pgvectorChunks is None:
            safePrint("⚠️ [에러] denseRetrieval 태스크로부터 pgvector 룩업 데이터를 가져오지 못했습니다. (None)")
            pgvectorChunks = [] # 빈 리스트로 방어
            
        if not globalChunksPool or not corpus:
            safePrint("⚠️ [에러] pullVectorData 태스크로부터 마스터 풀(globalChunksPool/corpus)을 로드하지 못했습니다.")
            return

        rerankModel = Variable.get("RERANK_MODEL", default_var="baai/bge-reranker-large")
        reranker = CrossEncoder(rerankModel)

        if corpus:
            bm25Index = BM25Okapi(corpus)
            safePrint(f"📊 [벤치마크 셋업] 마스터 검색 인덱스 빌드 완수 (총 {len(globalChunksPool)}개 청크)")

        vectorHitCount = 0
        hybridHitCount = 0
        totalCases = 0

        # 2. 각 쿼리별 루프 돌며 대조 실험 수행
        for idx, rule in enumerate(data):
            totalCases += 1
            
            # 검색 쿼리 구성 
            # ruleName = rule['ruleName']
            # indicatorNo = rule['indicatorNo']
            # query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

            ruleName = rule.get('ruleName', '')
            indicatorNo = rule.get('indicatorNo', '')
            query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

            # -------------------------------------------------------------
            # [정답 매칭 기준 정의] 
            # 발표 예시의 "정확한 타겟 법률 조항 청크"를 식별할 기준이 필요합니다.
            # 여기서는 예시로 해당 지표번호(indicatorNo)가 청크 content 내에 포함되어 있는지를 정답 원칙으로 잡았습니다.
            # (만약 실제 '정답 청크 ID'가 따로 정의되어 있다면 targetId = "조항ID" 형태로 변경 가능)
            # -------------------------------------------------------------
            # targetKeyword = f"지표 번호 {indicatorNo}" 

            # -------------------------------------------------------------
            # 대안 1. ruleName(위반 지표명)과 indicatorNo의 하이브리드 키워드 매칭법 (추천)
            # 현재 step01.py나 step04.py에서 생성하는 쿼리를 보면 대단히 구체적입니다.
            # query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"
            # 이 규제 법률 정보들이 PDF 가공 당시 청크의 content에 녹아들어 가 있을 것이므로, 청크 텍스트 내에 규제 조항 이름(ruleName)이 명확히 명시되어 있는지를 정답의 기준으로 삼는 방식입니다.
            # -------------------------------------------------------------
            targetRuleName = ruleName  # 예: "노동 인권 - 아동 노동 금지 조항"
            targetIndicator = str(indicatorNo) # 예: "2.1"
                      
           

            # -------------------------------------------------------------
            # 실험 A: 일반 Vector 단독 검색 (Baseline) - Top-3 진입 여부 체크
            # -------------------------------------------------------------
            # step02에서 저장한 쿼리별 pgvector 결과 획득
            # currentPgvectorResults = pgvectorChunks[idx] if idx < len(pgvectorChunks) else []
            if idx < len(pgvectorChunks) and pgvectorChunks[idx] is not None:
                currentPgvectorResults = pgvectorChunks[idx]
            else:
                currentPgvectorResults = []
            
            
            # 상위 3개 청크 추출
            vectorTop3 = currentPgvectorResults[:3]
            
            # Top-3 안에 정답(키워드 또는 ID)이 포함되어 있는지 확인
            # vectorHasTarget = any(targetKeyword in str(chunk.get("content", "")) for chunk in vectorTop3)
            # if vectorHasTarget:
            #     vectorHitCount += 1

            # 대안 1. 관련사항
            vectorHasTarget = any(
                (targetRuleName in chunk.get("content", "")) or (targetIndicator in chunk.get("content", ""))
                for chunk in vectorTop3 if isinstance(chunk, dict)
            )
            if vectorHasTarget:
                vectorHitCount += 1

            # -------------------------------------------------------------
            # 실험 B: 개발자님의 고도화 파이프라인 (BM25 + pgvector + Reranker)
            # -------------------------------------------------------------
            bm25RankMap = sparseSearch(query, bm25Index, globalChunksPool)
            if bm25RankMap is None: continue
            
            rrfScores = reciprocalRank(currentPgvectorResults, bm25RankMap)
            if rrfScores is None: continue

            sortedRrfIds = sorted(rrfScores.keys(), key=lambda x: rrfScores[x], reverse=True)[:10]
            candidateChunks = chunkMapping(sortedRrfIds, globalChunksPool, query, reranker)
            if candidateChunks is None: continue
            
            # 리랭커까지 거친 최종 상위 3개 청크 추출
            hybridTop3 = candidateChunks[:3]
            
            # Top-3 안에 정답이 포함되어 있는지 확인
            # hybridHasTarget = any(targetKeyword in str(chunk.get("content", "")) for chunk in hybridTop3)

            hybridHasTarget = any(
                (targetRuleName in chunk.get("content", "")) or (targetIndicator in chunk.get("content", ""))
                for chunk in hybridTop3 if isinstance(chunk, dict)
            )
            if hybridHasTarget:
                hybridHitCount += 1

            # 3. 최종 정확도(Hit Rate @ 3) 계산 및 로깅
            if totalCases > 0:
                vectorHitRate = (vectorHitCount / totalCases) * 100
                hybridHitRate = (hybridHitCount / totalCases) * 100
                
                safePrint("\n" + "="*50)
                safePrint(f"📊 [PPT 발표용 벤치마크 대조 실험 결과]")
                safePrint(f"🔹 총 평가 데이터 수: {totalCases} 개")
                safePrint(f"❌ 일반 Vector 단독 검색 Top-3 적중률: {vectorHitRate:.2f}%")
                safePrint(f"🔥 고도화 하이브리드 파이프라인 Top-3 적중률: {hybridHitRate:.2f}%")
                safePrint("="*50 + "\n")
                
                ti.xcom_push(key='benchmarkResults', value={"vector": vectorHitRate, "hybrid": hybridHitRate})
            else:
                safePrint("⚠️ 평가할 데이터(task0 결과)가 존재하지 않습니다.")

    except Exception as e:
        safePrint(f"❌ 벤치마크 실행 중 오류 발생: {e}")
        safePrint("💡 조치 방법: 재도전 ...")
        raise e

        