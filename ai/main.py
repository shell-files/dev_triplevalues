"""
Main Runner: Executes concurrent ingestion, ontology caching, Hugging Face upload, and hybrid search.
"""
import os
from settings import safePrint
from engine import runConcurrentIngestionPipeline

if __name__ == "__main__":
    # 로컬 테스트 디렉토리 보장
    os.makedirs("./esg_pdf_files", exist_ok=True)
    os.makedirs("./esg_excel_files", exist_ok=True)
    
    # 동시 다발 파이프라인 기동 (HuggingFace 저장소 ID를 전달하면 실시간 자동 업로드 실행)
    runConcurrentIngestionPipeline(
        pdfDir="./esg_pdf_files", 
        excelDir="./esg_excel_files",
        hfRepo=settings.hf_repo
    )