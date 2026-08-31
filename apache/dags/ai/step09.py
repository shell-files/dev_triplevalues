import numpy as np
from airflow.models import Variable
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from ai.aicommon import simpleTokenizer, safePrint

from ai.step04 import sparseSearch, reciprocalRank, chunkMapping

# def task9(**context):
#     try:
#         # 💡 [대안 3 핵심] 발표용 정밀 정답 셋업 (alertId : 정확한 esg_pdf_vectors 테이블의 id 리스트)
#         # 마리아DB의 alert_id와 매핑되어야 할 Postgres 내부 청크 ID를 수동 지정합니다.
#         GROUND_TRUTH_MAP = {
            # 1: [257, 378],  
            # 2: [3, 379, 394], 
            # 3: [380],
            # 4: [381, 394, 399],
            # 5: [382, 69],
            # 6: [383],
            # 7: [384],
            # 8: [385],
            # 9: [386],
            # 10: [388, 397, 70],
            # 11: [389],
            # 12: [390, 10],
            # 13: [4, 5, 8, 390],
            # 14: [77, 82, 144, 392],
            # 15: [69, 393, 407, 408],
            # 16: [394, 427, 69],
            # 17: [257, 378],  
            # 18: [3, 379, 394], 
            # 19: [380],
            # 20: [381, 394, 399],
            # 21: [382, 69],
            # 22: [383],
            # 23: [384],
            # 24: [385],
            # 25: [386],
            # 26: [388, 397, 70],
            # 27: [389],
            # 28: [390, 10],
            # 29: [4, 5, 8, 390],
            # 30: [77, 82, 144, 392],
#         }

#         ti = context['ti']
#         data = ti.xcom_pull(task_ids='collectData', key='task0')
#         pgvectorChunks = ti.xcom_pull(task_ids='denseRetrieval', key='task2')
#         globalChunksPool = ti.xcom_pull(task_ids='pullVectorData', key='task3-chunksPool')
#         corpus = ti.xcom_pull(task_ids='pullVectorData', key='task3-corpus')

#         if data is None:
#             safePrint("⚠️ [에러] collectData 태스크로부터 분석 대상 데이터를 가져오지 못했습니다. (None)")
#             return
#         if pgvectorChunks is None:
#             safePrint("⚠️ [에러] denseRetrieval 태스크로부터 pgvector 룩업 데이터를 가져오지 못했습니다. (None)")
#             pgvectorChunks = []
            
#         if not globalChunksPool or not corpus:
#             safePrint("⚠️ [에러] pullVectorData 태스크로부터 마스터 풀(globalChunksPool/corpus)을 로드하지 못했습니다.")
#             return

#         rerankModel = Variable.get("RERANK_MODEL", default_var="baai/bge-reranker-large")
#         reranker = CrossEncoder(rerankModel)

#         if corpus:
#             bm25Index = BM25Okapi(corpus)
#             safePrint(f"📊 [벤치마크 셋업] 마스터 검색 인덱스 빌드 완수 (총 {len(globalChunksPool)}개 청크)")

#         vectorHitCount = 0
#         hybridHitCount = 0
#         totalCases = 0

#         # 2. 각 쿼리별 루프 돌며 대조 실험 수행
#         for idx, rule in enumerate(data):
#             alertId = rule.get('alertId')
            
#             # 💡 [대안 3 핵심] 정답 매핑 테이블(GT)에 등록된 핵심 평가 대상 데이터만 선별하여 검증
#             if alertId not in GROUND_TRUTH_MAP:
#                 continue
                
#             totalCases += 1
#             correctChunkIds = GROUND_TRUTH_MAP[alertId] # 정답 ID 리스트 획득
            
#             ruleName = rule.get('ruleName', '')
#             indicatorNo = rule.get('indicatorNo', '')
#             query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

#             # -------------------------------------------------------------
#             # 실험 A: 일반 Vector 단독 검색 (Baseline) - Top-3 진입 여부 체크
#             # -------------------------------------------------------------
#             if idx < len(pgvectorChunks) and pgvectorChunks[idx] is not None:
#                 currentPgvectorResults = pgvectorChunks[idx]
#             else:
#                 currentPgvectorResults = []
                
#             vectorTop3 = currentPgvectorResults[:3]
            
#             # 수동 지정한 정답 청크 ID가 하나라도 일반 벡터 검색 Top-3에 포함되었는지 확인
#             vectorHasTarget = any(
#                 chunk.get("id") in correctChunkIds 
#                 for chunk in vectorTop3 if isinstance(chunk, dict)
#             )
#             if vectorHasTarget:
#                 vectorHitCount += 1

#             # -------------------------------------------------------------
#             # 실험 B: 개발자님의 고도화 파이프라인 (BM25 + pgvector + Reranker)
#             # -------------------------------------------------------------
#             bm25RankMap = sparseSearch(query, bm25Index, globalChunksPool)
#             if bm25RankMap is None: continue
            
#             rrfScores = reciprocalRank(currentPgvectorResults, bm25RankMap)
#             if rrfScores is None: continue

#             sortedRrfIds = sorted(rrfScores.keys(), key=lambda x: rrfScores[x], reverse=True)[:10]
#             candidateChunks = chunkMapping(sortedRrfIds, globalChunksPool, query, reranker)
#             if candidateChunks is None: continue
            
#             hybridTop3 = candidateChunks[:3]
            
#             # 수동 지정한 정답 청크 ID가 하나라도 고도화 하이브리드 파이프라인 Top-3에 포함되었는지 확인
#             hybridHasTarget = any(
#                 chunk.get("id") in correctChunkIds 
#                 for chunk in hybridTop3 if isinstance(chunk, dict)
#             )
#             if hybridHasTarget:
#                 hybridHitCount += 1

#         # 3. 최종 정확도(Hit Rate @ 3) 계산 및 로깅
#         if totalCases > 0:
#             vectorHitRate = (vectorHitCount / totalCases) * 100
#             hybridHitRate = (hybridHitCount / totalCases) * 100
            
#             safePrint("\n" + "="*50)
#             safePrint(f"📊 [PPT 발표용 벤치마크 대조 실험 결과 - 대안 3 수동 매핑 검증]")
#             safePrint(f"🔹 총 평가 데이터 수(수동 맵 타겟): {totalCases} 개")
#             safePrint(f"❌ 일반 Vector 단독 검색 Top-3 적중률: {vectorHitRate:.2f}%")
#             safePrint(f"🔥 고도화 하이브리드 파이프라인 Top-3 적중률: {hybridHitRate:.2f}%")
#             safePrint("="*50 + "\n")
            
#             ti.xcom_push(key='benchmarkResults', value={"vector": vectorHitRate, "hybrid": hybridHitRate})
#         else:
#             safePrint("⚠️ GROUND_TRUTH_MAP에 매칭되는 마리아DB alertId 데이터가 존재하지 않습니다.")

#     except Exception as e:
#         safePrint(f"❌ 벤치마크 실행 중 오류 발생: {e}")
#         safePrint("💡 조치 방법: 재도전 ...")
#         raise e

def task9(**context):
    try:
        GROUND_TRUTH_MAP = {
            1: [257, 378],  
            2: [3, 379, 394], 
            3: [380],
            4: [381, 394, 399],
            5: [382, 69],
            6: [383],
            7: [],
            8: [385],
            9: [386],
            10: [388, 397, 70],
            11: [389],
            12: [390, 10],
            13: [4, 5, 8, 390],
            14: [77, 82, 144, 392],
            15: [69, 393, 407, 408],
            16: [394, 427, 69],
            17: [257, 378],  
            18: [3, 379, 394], 
            19: [380],
            20: [381, 394, 399],
            21: [382, 69],
            22: [383],
            23: [384],
            24: [385],
            25: [386],
            26: [388, 397, 70],
            27: [389],
            28: [390, 10],
            29: [4, 5, 8, 390],
            30: [77, 82, 144, 392],
            
        }

        ti = context['ti']
        data = ti.xcom_pull(task_ids='collectData', key='task0')
        pgvectorChunks = ti.xcom_pull(task_ids='denseRetrieval', key='task2')
        globalChunksPool = ti.xcom_pull(task_ids='pullVectorData', key='task3-chunksPool')
        corpus = ti.xcom_pull(task_ids='pullVectorData', key='task3-corpus')

        if data is None:
            safePrint("⚠️ [에러] collectData 태스크로부터 분석 대상 데이터를 가져오지 못했습니다. (None)")
            return
        if pgvectorChunks is None:
            safePrint("⚠️ [에러] denseRetrieval 태스크로부터 pgvector 룩업 데이터를 가져오지 못했습니다. (None)")
            pgvectorChunks = []
            
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

        for idx, rule in enumerate(data):
            alertId = rule.get('alertId')
            
            if alertId not in GROUND_TRUTH_MAP:
                continue
                
            totalCases += 1
            correctChunkIds = GROUND_TRUTH_MAP[alertId]
            
            ruleName = rule.get('ruleName', '')
            indicatorNo = rule.get('indicatorNo', '')
            query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

            # -------------------------------------------------------------
            # 실험 A: 일반 Vector 단독 검색 (Baseline)
            # -------------------------------------------------------------
            if idx < len(pgvectorChunks) and pgvectorChunks[idx] is not None:
                currentPgvectorResults = pgvectorChunks[idx]
            else:
                currentPgvectorResults = []
                
            vectorTop3 = currentPgvectorResults[:3]
            
            # 💡 일반 벡터에서 추출된 상위 3개 ID 안전하게 파싱
            vectorTop3Ids = []
            for chunk in vectorTop3:
                if isinstance(chunk, dict):
                    vectorTop3Ids.append(chunk.get("id") or chunk.get("chunk_id"))
                elif isinstance(chunk, (list, tuple)) and len(chunk) > 0:
                    vectorTop3Ids.append(chunk[0])
                else:
                    vectorTop3Ids.append(chunk)
            
            vectorHasTarget = any(cid in correctChunkIds for cid in vectorTop3Ids if cid is not None)
            if vectorHasTarget:
                vectorHitCount += 1

            # -------------------------------------------------------------
            # 실험 B: 고도화 하이브리드 파이프라인 (BM25 + pgvector + Reranker)
            # -------------------------------------------------------------
            bm25RankMap = sparseSearch(query, bm25Index, globalChunksPool)
            if bm25RankMap is None: continue
            
            rrfScores = reciprocalRank(currentPgvectorResults, bm25RankMap)
            if rrfScores is None: continue

            sortedRrfIds = sorted(rrfScores.keys(), key=lambda x: rrfScores[x], reverse=True)[:10]
            candidateChunks = chunkMapping(sortedRrfIds, globalChunksPool, query, reranker)
            if candidateChunks is None: continue
            
            hybridTop3 = candidateChunks[:3]
            
            # 💡 하이브리드 파이프라인에서 최종 정렬된 상위 3개 ID 파싱
            hybridTop3Ids = [c.get("id") for c in hybridTop3 if isinstance(c, dict)]
            
            hybridHasTarget = any(cid in correctChunkIds for cid in hybridTop3Ids)
            if hybridHasTarget:
                hybridHitCount += 1

            # # 📊 [실시간 디버그 로그] 루프를 돌며 각 케이스별 ID 매칭 결과 출력
            # safePrint(f"📝 [Case {totalCases}] alertId: {alertId} 분석")
            # safePrint(f"   🎯 정답 가이드라인 Chunk ID 목록: {correctChunkIds}")
            # safePrint(f"   ❌ 일반 Vector Top-3 ID 결과 : {vectorTop3Ids} -> {'🟢 적중' if vectorHasTarget else '🔴 실패'}")
            # safePrint(f"   🔥 하이브리드 Top-3 ID 결과  : {hybridTop3Ids} -> {'🟢 적중' if hybridHasTarget else '🔴 실패'}")
            # safePrint("-" * 40)

        # 3. 최종 정확도 계산 및 로깅
        if totalCases > 0:
            vectorHitRate = (vectorHitCount / totalCases) * 100
            hybridHitRate = (hybridHitCount / totalCases) * 100
            
            safePrint("\n" + "="*50)
            safePrint(f"📊 [PPT 발표용 벤치마크 대조 실험 결과 - 대안 3 수동 매핑 검증]")
            safePrint(f"🔹 총 평가 데이터 수(수동 맵 타겟): {totalCases} 개")
            safePrint(f"❌ 일반 Vector 단독 검색 Top-3 적중률: {vectorHitRate:.2f}%")
            safePrint(f"🔥 고도화 하이브리드 파이프라인 Top-3 적중률: {hybridHitRate:.2f}%")
            safePrint("="*50 + "\n")
            
            ti.xcom_push(key='benchmarkResults', value={"vector": vectorHitRate, "hybrid": hybridHitRate})
        else:
            safePrint("⚠️ GROUND_TRUTH_MAP에 매칭되는 마리아DB alertId 데이터가 존재하지 않습니다.")

    except Exception as e:
        safePrint(f"❌ 벤치마크 실행 중 오류 발생: {e}")
        raise e