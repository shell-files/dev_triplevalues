"""
Integrated ESG Hybrid Engine: Ingestion Pipeline, Hybrid Retriever, 
Ontology Rule Registry, and Hugging Face Dataset Exporter.
"""
import os
import re
import json
import datetime
import hashlib
import glob
import time
import ollama
import pandas as pd
from pypdf import PdfReader
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from psycopg2.extras import execute_values
from datasets import Dataset 

import dbClient as db
from settings import settings, safePrint, simpleTokenizer

# 싱글톤 인스턴스 전역 정의
os.environ["OLLAMA_HOST"] = settings.ollama_host
ollamaClient = ollama.Client(host=settings.ollama_host)
reranker = CrossEncoder(settings.rerank_model)

# 인메모리 파이프라인 전역 상태 관리 객체 (CamelCase 적용)
bm25Index = None
globalChunksPool = []
ontologyRegistry: dict = {}
ontologyTemplateList: list = []


# ════════════════════════════════════════════════════════
# 🛠️ 온톨로지(Ontology) 전용 정규식 수치 분석 및 캐싱 로직
# ════════════════════════════════════════════════════════
def parseNumericCriteria(textCriteria: str) -> tuple[float | None, str]:
    """줄글 형태의 마스터 기준 답변 예시에서 비교 연산자와 임계 수치를 정규식으로 안전하게 추출합니다."""
    if not textCriteria:
        return None, ">="
    nums = re.findall(r"\d+\.\d+|\d+", textCriteria)
    if not nums:
        return None, ">="
    value = float(nums[0])
    
    operator = ">="
    if "이하" in textCriteria or "미만" in textCriteria or "Zero" in textCriteria or "0.0" in textCriteria:
        operator = "<="
    elif "초과" in textCriteria:
        operator = ">"
    elif "미달" in textCriteria:
        operator = "<"
    return value, operator

def buildOntologyRegistry():
    """MariaDB의 최신 마스터 지표 데이터를 조회하여 메모리 내 온톨로지 사전을 완전히 동기화 구축합니다."""
    global ontologyRegistry, ontologyTemplateList
    ontologyRegistry.clear()
    ontologyTemplateList.clear()
    
    sql = "SELECT indicator_no, indicator_name, question, action_plan FROM SELF_ASSESS_CHECKLIST"
    rows = db.findAll(sql)
    
    for row in rows:
        indName = row["indicator_name"]
        rawCriteria = row["question"]
        val, op = parseNumericCriteria(rawCriteria)
        
        # 1. 인메모리 딕셔너리 매핑 레이어 적재
        ontologyRegistry[indName] = {
            "indicator_no": row["indicator_no"],
            "action_plan": row.get("action_plan", "즉시 시정 조치 가동"),
            "threshold_value": val if val is not None else 0.0,
            "operator": op,
            "raw_text": rawCriteria
        }
        
        # 2. AI 학습용 및 아티팩트용 템플릿 리스트 생성
        ontologyTemplateList.append({
            "indicator_no": row["indicator_no"],
            "indicator_name": indName,
            "parsed_operator": op,
            "parsed_threshold": val if val is not None else 0.0,
            "raw_expression": rawCriteria
        })
        
    safePrint(f"[온톨로지 엔지니어링] 총 {len(ontologyRegistry)}개의 지표 온톨로지 규칙 캐싱 완료.")

def exportOntologyToJsonl(outputFilename: str = "esgOntologyTemplate.jsonl"):
    """구축된 온톨로지 리스트를 파인튜닝 지식 데이터 백업용 JSONL 파일로 출력합니다."""
    global ontologyTemplateList
    if not ontologyTemplateList:
        return
    try:
        with open(outputFilename, "w", encoding="utf-8") as f:
            for item in ontologyTemplateList:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        safePrint(f"[온톨로지 백업] AI 파인튜닝 포맷 이관 완료: {outputFilename}")
    except Exception as e:
        safePrint(f"[온톨로지 백업 실패] : {e}")


# ════════════════════════════════════════════════════════
# 🚀 Ingestion Pipeline (PDF pgvector + Excel MariaDB + HF 업로드 동시 처리)
# ════════════════════════════════════════════════════════
# 
def extractAndChunkPdf(pdfPath: str, chunkSize: int = 500, chunkOverlap: int = 150) -> list:
    """150자 오버랩 연결 결합 세팅이 추가된 슬라이딩 윈도우 청킹 함수"""
    chunks = []
    fileName = os.path.basename(pdfPath)
    try:
        reader = PdfReader(pdfPath)
        fullText = "".join([page.extract_text() or "" for page in reader.pages])
        fullText = re.sub(r'\s+', ' ', fullText).strip()
        
        # 500자 크기로 슬라이싱하되, 다음 시작점은 350자(500 - 150) 뒤로 설정하여 150자가 중복 결합됨
        step = chunkSize - chunkOverlap
        if step <= 0: step = chunkSize  # 예외 방지 가드레일

        for i in range(0, len(fullText), step):
            textSlice = fullText[i:i+chunkSize]            
            # 고유 식별을 위한 해시값 생성
            chunkId = hashlib.md5(f"{fileName}_{i}_{textSlice[:20]}".encode()).hexdigest()
            chunks.append({
                "chunk_id": chunkId,
                "file_name": fileName,
                "content": textSlice,
                "doc_type": "PDF",
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # 텍스트의 끝에 도달하면 루프 종료
            if i + chunkSize >= len(fullText):
                break
                
    except Exception as e:
        safePrint(f"[오류] PDF 파싱 실패 ({fileName}): {e}")
    return chunks

def initAndSaveToPgvector(chunks: list):
    conn = db.getPostgresConn()
    if not conn: return
    try:
        with conn, conn.cursor() as cur:
            # CREATE EXTENSION: PostgreSQL에서 기본적으로 제공하지 않는 특수한 기능(데이터 타입, 인덱스, 함수 등)을 추가할 때 사용하는 명령어
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ESG_PDF_VECTORS (
                    id SERIAL PRIMARY KEY,
                    chunk_id TEXT UNIQUE,
                    fileName TEXT,
                    content TEXT,
                    embedding vector(1024),
                    timestamp TEXT
                );
            """)
            
            dataToInsert = []
            for chunk in chunks:
                resp = ollamaClient.embeddings(model=settings.embed_model, prompt=chunk["content"])
                dataToInsert.append((chunk["chunk_id"], chunk["file_name"], chunk["content"], resp["embedding"], chunk["timestamp"]))
            
            execute_values(cur, """
                INSERT INTO ESG_PDF_VECTORS (chunk_id, file_name, content, embedding, timestamp)
                VALUES %s ON CONFLICT (chunk_id) DO NOTHING;
            """, dataToInsert)
            conn.commit()
            safePrint(f"[PostgreSQL] {len(chunks)}개 PDF 벡터 스토어 동기화 완료.")
    except Exception as e:
        safePrint(f"[PostgreSQL 오류] pgvector 저장 실패: {e}")

def loadSelfAssessChecklistToMariadb(excelDir: str):
    """
    엑셀의 각 시트(탭) 이름을 기반으로 partnerType을 동적으로 추출하여
    SELF_ASSESS_CHECKLIST 테이블에 마스터 데이터를 정합성 있게 적재합니다.
    
    [partnerType 변환 규칙]
    - '1차 협력사' -> '1차 협력사'
    - '2차 협력사 Hall제련' -> '2차 협력사'
    - '3차-A 채굴 (전체 3차 적용)' -> '3차-A'
    - '3차-B Bayer정련 (알루미나)' -> '3차-B'
    """
    # 1. 마스터 데이터 갱신을 위한 기존 테이블 초기화 및 외래키 체크 제어
    db.save("SET FOREIGN_KEY_CHECKS = 0;")
    db.save("TRUNCATE TABLE SELF_ASSESS_CHECKLIST;")
    db.save("SET FOREIGN_KEY_CHECKS = 1;")
    
    checklistRows = []
    
    # 디렉토리 내 엑셀 파일 탐색
    for pattern in ("*.xlsx", "*.xls"):
        for excelPath in glob.glob(os.path.join(excelDir, pattern)):
            try:
                # sheetName=None 설정으로 모든 시트를 딕셔너리 형태로 호출
                # header=0 설정으로 최상단 제목 열(헤더)을 데이터 파싱에서 제외
                xlDict = pd.read_excel(excelPath, sheetName=None, header=0)
                
                for sheetName, df in xlDict.items():
                    # 시트 이름(탭 이름) 정제 로직 생성
                    sheetNameClean = sheetName.strip()
                    
                    # 정규식을 사용하여 '1차 협력사', '2차 협력사', '3차-A', '3차-B' 형태의 핵심 접두사 추출
                    match = re.search(r"^(\d+차\s*협력사|\d+차-[A-Z])", sheetNameClean)
                    if match:
                        partnerType = match.group(1).strip()
                    else:
                        # 매칭 구조가 예외일 경우 공백 제거 후 10자까지만 폴백용으로 사용
                        partnerType = sheetNameClean[:10]
                    
                    safePrint(f"[파싱 진행] 시트명: '{sheetName}' -> 확정 partnerType: '{partnerType}'")
                    
                    for idx, row in df.iterrows():
                        # 결측치(NaN) 데이터를 빈 문자열('')로 안전 치환 후 텍스트 공백 제거
                        rowVals = [str(v).strip() if pd.notna(v) else "" for v in row.values]
                        
                        # 최소한 지표번호와 카테고리, 지표명이 존재할 수 있는 배열 길이인지 검증
                        if len(rowVals) >= 3:
                            indicatorNoRaw = rowVals[0]
                            if not indicatorNoRaw.replace('.0', '').isdigit(): # 실수형 문자열 차단 방어
                                continue
                            
                            # DDL 구조 및 제공된 데이터프레임 구조에 따른 1:1 변수 매핑
                            indicatorNo   = int(indicatorNoRaw) # 정수 변환
                            category       = rowVals[1] if len(rowVals) > 1 else "공통"
                            indicatorName = rowVals[2] if len(rowVals) > 2 else "미지정 지표"
                            priority       = rowVals[3] if len(rowVals) > 3 else "Normal"
                            starYn        = rowVals[4] if len(rowVals) > 4 else "N"
                            question       = rowVals[5] if len(rowVals) > 5 else ""
                            passAnswer    = rowVals[6] if len(rowVals) > 6 else ""
                            failAnswer    = rowVals[7] if len(rowVals) > 7 else ""
                            riskLevel     = rowVals[8] if len(rowVals) > 8 else "중"
                            evidenceYn    = rowVals[9] if len(rowVals) > 9 else "N"
                            evidenceList  = rowVals[10] if len(rowVals) > 10 else ""
                            actionPlan    = rowVals[11] if len(rowVals) > 11 else "즉시 시정조치 가이드라인 가동"
                            deleteYn      = 0  # 삭제 여부 기본값 FALSE(0)
                            
                            # 2. DDL insert 문 매핑 구조 파라미터 리스트업
                            checklistRows.append((
                                partnerType,  
                                indicatorNo,
                                category,
                                indicatorName,
                                priority,
                                starYn,
                                question,
                                passAnswer,
                                failAnswer,
                                riskLevel,
                                evidenceYn,
                                evidenceList,
                                actionPlan,
                                deleteYn
                            ))
                            
            except Exception as e:
                safePrint(f"[오류] '{os.path.basename(excelPath)}' 처리 중 크리티컬 예외 발생: {e}")
                
    # 3. 데이터베이스 벌크 인서트 수행
    if checklistRows:
        sql = """
            INSERT INTO SELF_ASSESS_CHECKLIST (
                partner_type, indicator_no, category, indicator_name, priority, 
                star_yn, question, pass_answer, fail_answer, risk_level, 
                evidence_yn, evidence_list, action_plan, delete_yn
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        db.saveMany(sql, checklistRows)
        safePrint(f"\n[MariaDB 성공] 시트별 등급 분기 적용 완료 -> 총 {len(checklistRows)}개 핵심 지표 마스터 적재 완료.")

def loadRiskCriteriaToMariadb(excelDir: str):
    """
    '자가진단_리스크_분류_기준.xlsx' 파일을 읽어 
    제공된 실제 DDL 구조를 가진 ESG_RISK_CRITERIA 테이블에 전수 적재합니다.
    """
    # 1. 기존 리스크 기준 마스터 초기화 및 외래키 체크 제어
    db.save("SET FOREIGN_KEY_CHECKS = 0;")
    db.save("TRUNCATE TABLE ESG_RISK_CRITERIA;")
    db.save("SET FOREIGN_KEY_CHECKS = 1;")
    
    riskCriteriaRows = []
    seenItems = set()
    
    # 디렉토리 내에서 리스크 분류 기준 관련 엑셀 파일 탐색
    for pattern in ("*리스크*분류*.xlsx", "*리스크*분류*.xls", "자가진단_리스크_분류_기준.xlsx"):
        for excelPath in glob.glob(os.path.join(excelDir, pattern)):
            try:
                # 첫 번째 행은 타이틀 텍스트이므로 header=1로 설정하여 지정합니다.
                xlDict = pd.read_excel(excelPath, sheetName=None, header=1)
                
                for sheetName, df in xlDict.items():
                    safePrint(f"[리스크 분류 파싱] 파일: {os.path.basename(excelPath)} / 시트명: '{sheetName}'")
                    
                    for idx, row in df.iterrows():
                        rowVals = [str(v).strip() if pd.notna(v) else "" for v in row.values]
                        
                        if len(rowVals) >= 4:
                            itemName   = rowVals[0] 
                            highRisk   = rowVals[1] 
                            mediumRisk = rowVals[2] 
                            lowRisk    = rowVals[3] 
                            
                            if not itemName or itemName == "항목" or "기준 추천" in itemName:
                                continue
                                
                            if itemName not in seenItems:
                                riskCriteriaRows.append((
                                    itemName,
                                    highRisk,
                                    mediumRisk,
                                    lowRisk
                                ))
                                seenItems.add(itemName)
                                
            except Exception as e:
                safePrint(f"[오류] '{os.path.basename(excelPath)}' 리스크 기준 파싱 중 크리티컬 예외 발생: {e}")

    # 2. 마리아DB 최종 벌크 인서트 트랜잭션 수행
    if riskCriteriaRows:
        sqlRisk = """
            INSERT INTO ESG_RISK_CRITERIA (
                item_name, high_risk, medium_risk, low_risk
            ) VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                high_risk = VALUES(high_risk), 
                medium_risk = VALUES(medium_risk), 
                low_risk = VALUES(low_risk);
        """
        db.saveMany(sqlRisk, riskCriteriaRows)
        safePrint(f"[MariaDB 성공] ESG_RISK_CRITERIA 테이블에 총 {len(riskCriteriaRows)}건의 리스크 평가 마스터 기준 적재 완료.")
    else:
        safePrint("[경고] 적재 대상 리스크 분류 기준 데이터가 존재하지 않습니다. 파일 경로 및 파일 양식(Header)을 확인하세요.")

def exportPgvectorToHf(repoId: str ):
    """ [복원] PostgreSQL pgvector에 저장된 모든 원천 지식 임베딩 데이터를 끌어올려 Hugging Face 허브로 원격 백업합니다."""
    conn = db.getPostgresConn()
    if not conn: return
    safePrint(f"[HuggingFace 백업] '{repoId}' 허브로 벡터 데이터셋 업로드를 시작합니다...")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT chunk_id, file_name, content, embedding, timestamp FROM ESG_PDF_VECTORS;")
            rows = cur.fetchall()
            
        if not rows:
            safePrint("[HuggingFace 백업 경고] 업로드할 데이터가 백엔드 DB에 존재하지 않습니다.")
            return
            
        df = pd.DataFrame(rows, columns=["chunk_id", "file_name", "content", "embedding", "timestamp"])
        dataset = Dataset.from_pandas(df)
        
        dataset.push_to_hub(repoId, private=False)
        safePrint(f"[HuggingFace 성공] 백업 허브 빌드 및 업로드 완료 -> {repoId}")
    except Exception as e:
        safePrint(f"[HuggingFace 오류] 원격 클라우드 업로드 실패: {e}")

def runConcurrentIngestionPipeline(pdfDir: str, excelDir: str, hfRepo: str = None):
    """[동시 다발 처리] PDF(pgvector) 적재, Excel(MariaDB) 적재, 온톨로지 캐싱 및 HF 백업을 원스톱으로 처리합니다."""
    safePrint("\n=== 🚀 [통합 파이프라인] 전처리 및 분기 동시 적재 가동 ===")
    
    # 1. PDF 가공 후 pgvector 적재 및 BM25 구축
    pdfChunks = []
    for pdfPath in glob.glob(os.path.join(pdfDir, "*.pdf")):
        pdfChunks.extend(extractAndChunkPdf(pdfPath))
    if pdfChunks:
        initAndSaveToPgvector(pdfChunks)
        
        global globalChunksPool, bm25Index
        globalChunksPool = pdfChunks
        tokenizedCorpus = [simpleTokenizer(c["content"]) for c in pdfChunks]
        bm25Index = BM25Okapi(tokenizedCorpus)
        
    # 2. 엑셀 마스터 적재 및 온톨로지 캐시 레이어 빌드 (동시 수행)
    loadSelfAssessChecklistToMariadb(excelDir)
    loadRiskCriteriaToMariadb(excelDir)
    buildOntologyRegistry()
    exportOntologyToJsonl("esgOntologyTemplate.jsonl")
    
    # 3. 데이터셋 허깅페이스 파이프라인 원격 이관 트리거
    if hfRepo:
        exportPgvectorToHf(repoId=hfRepo)

