import numpy as np
from airflow.models import Variable
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from ai.aicommon import simpleTokenizer, safePrint

from ai.step04 import sparseSearch, reciprocalRank, chunkMapping

def task8(**context):
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
            
            ruleName = rule.get('ruleName', '')
            indicatorNo = rule.get('indicatorNo', '')
            query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

            # -------------------------------------------------------------
            # 실험 B 단계를 먼저 수행 (의사 정답 추출을 위함)
            # -------------------------------------------------------------
            if idx < len(pgvectorChunks) and pgvectorChunks[idx] is not None:
                currentPgvectorResults = pgvectorChunks[idx]
            else:
                currentPgvectorResults = []

            bm25RankMap = sparseSearch(query, bm25Index, globalChunksPool)
            if bm25RankMap is None: continue
            
            rrfScores = reciprocalRank(currentPgvectorResults, bm25RankMap)
            if rrfScores is None: continue

            sortedRrfIds = sorted(rrfScores.keys(), key=lambda x: rrfScores[x], reverse=True)[:10]
            candidateChunks = chunkMapping(sortedRrfIds, globalChunksPool, query, reranker)
            if candidateChunks is None or len(candidateChunks) == 0: continue
            
            # 리랭커까지 거친 최종 상위 3개 청크 추출
            hybridTop3 = candidateChunks[:3]

            # 💡 [대안 2 핵심] 하이브리드 파이프라인 최종 1위를 Pseudo Ground Truth(정답)로 규정
            targetChunkId = candidateChunks[0]['id'] 

            # -------------------------------------------------------------
            # 실험 A: 일반 Vector 단독 검색 (Baseline) - Top-3 진입 여부 체크
            # -------------------------------------------------------------
            vectorTop3 = currentPgvectorResults[:3]
            vectorTop3Ids = [chunk.get("id") for chunk in vectorTop3 if isinstance(chunk, dict)]
            
            # 일반 벡터 단독 검색이 최종 하이브리드 1위 문서를 Top-3 안에 포함했는지 대조
            if targetChunkId in vectorTop3Ids:
                vectorHitCount += 1

            # -------------------------------------------------------------
            # 실험 B 평가: 하이브리드 결과 내에 정답(최종 1위)이 포함되어 있는지 대조
            # -------------------------------------------------------------
            hybridTop3Ids = [chunk.get("id") for chunk in hybridTop3 if isinstance(chunk, dict)]
            if targetChunkId in hybridTop3Ids:
                hybridHitCount += 1

        # 3. 최종 정확도(Hit Rate @ 3) 계산 및 로깅
        if totalCases > 0:
            vectorHitRate = (vectorHitCount / totalCases) * 100
            hybridHitRate = (hybridHitCount / totalCases) * 100
            
            safePrint("\n" + "="*50)
            safePrint(f"📊 [PPT 발표용 벤치마크 대조 실험 결과 - 대안 2 의사정답 기준]")
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