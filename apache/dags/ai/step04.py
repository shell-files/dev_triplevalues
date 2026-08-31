from sentence_transformers import CrossEncoder
from rank_bm25 import BM25Okapi
import numpy as np
from ai.aicommon import simpleTokenizer, safePrint
from airflow.models import Variable

def sparseSearch(query, bm25Index, globalChunksPool):
    try:
        tokenizedQuery = simpleTokenizer(query)
        bm25Scores = bm25Index.get_scores(tokenizedQuery)
        if np.all(bm25Scores == 0):
            print(f"⚠️ [주의] 쿼리에 매칭되는 형태소가 코퍼스에 없습니다: {query}")
            return {}
        
        bm25RankIdxs = np.argsort(bm25Scores)[::-1][:20]  # 상위 20개 추출
        return {globalChunksPool[idx]["id"]: rank for rank, idx in enumerate(bm25RankIdxs, 1)}
    except Exception as e:
        print(f"❌ sparseSearch 오류: {e}")
        return None
    
def reciprocalRank(pgvectorChunks, bm25RankMap):
    try:
        # pgvectorRankMap = {r: rank for rank, r in enumerate(pgvectorChunks, 1)}
        pgvectorRankMap = {}
        for rank, r in enumerate(pgvectorChunks, 1):
            # 💡 만약 r이 리스트나 튜플 형태라면 첫 번째 요소(보통 ID)를 끄집어냅니다.
            if isinstance(r, (list, tuple)):
                key_candidate = r[0]
            # 💡 만약 r이 딕셔너리라면 'id' 키를 가져옵니다.
            elif isinstance(r, dict):
                key_candidate = r.get("id") or r.get("chunk_id")
            # 💡 일반 문자열이나 숫자라면 그대로 사용합니다.
            else:
                key_candidate = r

            # 해시 불가능한 데이터 타입(list, dict)이 키로 들어오는 것을 원천 차단
            if isinstance(key_candidate, (list, dict)):
                key_candidate = str(key_candidate)

            if key_candidate:
                pgvectorRankMap[key_candidate] = rank

        # 3. 🎯 RRF (Reciprocal Rank Fusion) 상호 역순위 융합 연산 스코어링
        rrfScores = {}
        k_constant = 60  # RRF 표준 상수
        
        allCandidateIds = set(list(bm25RankMap.keys()) + list(pgvectorRankMap.keys()))
        
        for cid in allCandidateIds:
            score = 0.0
            if cid in bm25RankMap:
                score += 1.0 / (k_constant + bm25RankMap[cid])
            if cid in pgvectorRankMap:
                score += 1.0 / (k_constant + pgvectorRankMap[cid])
            rrfScores[cid] = score
        return rrfScores
    except Exception as e:
        print(f"❌ reciprocalRank 오류: {e}")
        return None

def chunkMapping(sortedRrfIds, globalChunksPool, query, reranker):
    try:
        # ID 기반으로 실제 텍스트 청크 매핑
        candidateChunks = []
        for cid in sortedRrfIds:
            match = next((item for item in globalChunksPool if item["id"] == cid), None)
            if match:
                candidateChunks.append(match)
                
        if not candidateChunks:
            return []

        # 4. 🎯 CrossEncoder 리랭커 기반 최종 고정밀 필터링
        pairs = [[query, c["content"]] for c in candidateChunks]
        rerankScores = reranker.predict(pairs)
        
        for i, score in enumerate(rerankScores):
            candidateChunks[i]["rerank_score"] = float(score)
            
        # 리랭킹 점수 기준 내림차순 최종 정렬
        candidateChunks.sort(key=lambda x: x["rerank_score"], reverse=True)
        return candidateChunks
    except Exception as e:
        print(f"❌ chunkMapping 오류: {e}")
        return None
    
def createPrompt(contextStr, ruleName, indicatorNo, operator, thresholdValue, answerText):
    return f"""
        [글로벌 ESG 규제 표준 문서 컨텍스트 - 마스터 하이브리드 엔진 융합 결과]
        {contextStr}
        
        [실시간 가드레일 위반 탐지 정황]
        - 지표 항목 : {ruleName} (지표 식별 코드: {indicatorNo})
        - 관리 가드레일 기준 식: {operator} {thresholdValue}
        - 협력사 정제 답변 수치 context : {answerText}
    """

def task4(**context):
    try:
        ti = context['ti']
        data = ti.xcom_pull(task_ids='collectData', key='task0')
        pgvectorChunks = ti.xcom_pull(task_ids='denseRetrieval', key='task2')
        globalChunksPool = ti.xcom_pull(task_ids='pullVectorData', key='task3-chunksPool')
        corpus = ti.xcom_pull(task_ids='pullVectorData', key='task3-corpus')
        rerank_model = Variable.get("RERANK_MODEL", default_var="baai/bge-reranker-large")
        top_k = int(Variable.get("TOP_K", default_var="3"))
        reranker = CrossEncoder(rerank_model)
        prompts = []
            
        if corpus:
            bm25Index = BM25Okapi(corpus)
            safePrint(f"[하이브리드 인프라] 마스터 검색 인덱스 메모리 풀 동적 빌드 완수 (총 {len(globalChunksPool)}개 청크)")
        else:
            # 벡터 코퍼스가 비어 있으면 bm25Index 미정의로 NameError 가 나고
            # except 가 push 없이 삼켜 loadPrompt 가 None 순회로 죽는다 → 빈 결과를 push 하고 종료
            safePrint("[경고] pgvector 코퍼스가 비어 있어 리랭킹/프롬프트 생성을 건너뜁니다.")
            ti.xcom_push(key='task4', value=prompts)
            return

        for rule in data:
            alertId = rule['alertId']
            ruleName = rule['ruleName']
            indicatorNo = rule['indicatorNo']
            operator = rule['operator']
            thresholdValue = rule['thresholdValue']
            answerText = rule['answerText']
            query = f"{ruleName} 지표 번호 {indicatorNo} 글로벌 공급망 실사법 및 CSDDD 규제 대응 가이드라인 가이드 수칙"

            bm25RankMap = sparseSearch(query, bm25Index, globalChunksPool)
            if bm25RankMap is None: 
                break
            
            rrfScores = reciprocalRank(pgvectorChunks, bm25RankMap)
            if rrfScores is None:
                break

            # RRF 연산 기준 정렬 후 상위 후보 풀 확보
            sortedRrfIds = sorted(rrfScores.keys(), key=lambda x: rrfScores[x], reverse=True)[:10]

            # 무겁다
            candidateChunks= chunkMapping(sortedRrfIds, globalChunksPool, query, reranker)
            if candidateChunks is None:
                break
            
            searchResults = candidateChunks[:top_k]
            contextStr = "\n\n".join([chunk['content'] for chunk in searchResults])
            prompt = createPrompt(contextStr, ruleName, indicatorNo, operator, thresholdValue, answerText)
            data = {
                "alertId": alertId,
                "prompt": prompt
            }
            prompts.append(data)
        ti.xcom_push(key='task4', value=prompts)
    except Exception as e:
        print(f"❌ 오마이갓: {e}")
        print("💡 조치 방법: 집으로 ...")
        # 실패해도 downstream(loadPrompt)이 None 을 받지 않도록 빈 결과 push
        context['ti'].xcom_push(key='task4', value=[])
