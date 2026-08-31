-- pgvector 확장 및 DAG(ai/step02, step03)가 조회하는 벡터 테이블 초기화
CREATE EXTENSION IF NOT EXISTS vector;

-- bge-m3 임베딩(1024차원) 저장 테이블
CREATE TABLE IF NOT EXISTS esg_pdf_vectors (
    id        SERIAL PRIMARY KEY,
    content   TEXT NOT NULL,
    file_name VARCHAR(255),
    page_no   INTEGER,
    embedding vector(1024)
);
