# Apache Airflow 파이프라인 (dev_triplevalues 연동)

리스크 룰 엔진 + AI 심층 분석 DAG(`integratedRiskAiPipeline` 등)를 실행하는 Airflow 스택입니다.
루트 스택(frontend/backend)과 같은 `.env`, 같은 도커 네트워크를 공유하도록 구성되어 있습니다.

## 연동 구조

```
[루트 compose.yml]                     [apache/docker-compose.yaml]
frontend ─┐                            airflow-apiserver/scheduler/worker ...
backend ──┤── dev_triplevalues_main-network ──┤ (main-network: external 참조)
pgvector ─┘   (이름 고정)                     └─ airflow-postgres / airflow-redis
                                                 (airflow-network 내부 격리)
```

- DAG → **MariaDB** 적재: conn_id `mariadb_conn_id` (루트 `.env`의 `MARIA_DB_*` 값으로 자동 등록)
- DAG → **pgvector** 검색: conn_id `Vector` (루트 `.env`의 `POSTGRES_*` 값으로 자동 등록)
- DAG → **backend 알림**: Variable `WS_HOST` (기본값 `ws://backend:8000/ws/airflow/HMOS-001`)
- Ollama/모델 설정: Variable `OLLAMA_HOST`, `AI_MODEL`, `OLLAMA_EMBED_MODEL`(← `.env`의 `EMBED_MODEL`), `RERANK_MODEL`, `TOP_K`

Connection/Variable 모두 `AIRFLOW_CONN_*` / `AIRFLOW_VAR_*` 환경변수로 주입되므로
**Airflow UI에서 수동 등록할 필요가 없습니다.** (UI에는 목록으로 표시되지 않지만 조회는 됩니다)

## 루트 `.env`에 추가로 필요한 키

backend가 쓰는 키 외에 Airflow 전용으로 아래 키를 루트 `.env`에 추가합니다.

```env
# Airflow
AIRFLOW_UID=50000                # 리눅스: id -u 값
FERNET_KEY=<생성값>              # python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
AIRFLOW__API_AUTH__JWT_SECRET=<임의의 시크릿>
_AIRFLOW_WWW_USER_USERNAME=airflow
_AIRFLOW_WWW_USER_PASSWORD=<변경>
HF_TOKEN=<허깅페이스 토큰>       # 리랭커 모델 다운로드용
```

주의: `MARIA_DB_PASSWORD` / `POSTGRES_PASSWORD`에 `"` 또는 `\`가 들어가면
JSON 형식의 `AIRFLOW_CONN_*` 값이 깨지므로 해당 문자는 피하세요.

## 실행 순서

공유 네트워크(`dev_triplevalues_main-network`)는 루트 스택이 만들므로 루트를 먼저 올립니다.

로컬에는 서버에서 별도 운영되는 MariaDB/pgvector/Redis/Kafka 가 없으므로,
루트 스택 다음에 `compose.local.yml` 로 로컬 인프라를 올립니다.
백엔드 이미지는 최초 1회 `docker build -t uv:1 -f backend/uv.Dockerfile backend` 로 빌드합니다.

```bash
docker compose -f compose.local.yml up -d
```

```bash
docker compose up -d
```

```bash
docker compose -f apache/docker-compose.yaml --env-file .env up -d
```

- 두 명령 모두 **저장소 루트에서** 실행합니다.
- `--env-file .env`는 compose 변수 치환(`${MARIA_DB_USER}` 등)에 필요합니다.
- 컨테이너 내부용 env는 `env_file: ../.env`(compose 파일 기준 경로)로 자동 주입됩니다.
- Airflow UI: http://localhost:8080

## 확인 방법

```bash
docker compose -f apache/docker-compose.yaml --env-file .env exec airflow-scheduler airflow connections get mariadb_conn_id
```

```bash
docker compose -f apache/docker-compose.yaml --env-file .env exec airflow-scheduler airflow variables get WS_HOST
```

DAG 실행 후 backend 로그에 `/ws/airflow/HMOS-001` 웹소켓 수신이 찍히면 연동 완료입니다.

## 이전 구성 대비 변경점 (리팩토링 내역)

| 항목 | 이전 | 변경 |
| --- | --- | --- |
| 네트워크 | compose 기본 네트워크(고립) | `main-network`(external) 참여, 메타DB/브로커는 `airflow-network` 격리 |
| 메타DB/브로커 서비스명 | `postgres`, `redis` | `airflow-postgres`, `airflow-redis` (main-network 쪽 pgvector/redis와 DNS 충돌 방지) |
| Connection/Variable | UI 수동 등록 | 루트 `.env` 기반 `AIRFLOW_CONN_*` / `AIRFLOW_VAR_*` 자동 주입 |
| env_file | `apache/.env` (별도 관리) | 루트 `../.env` 공유 |
| `HF_TOKEN` | `${HF_TOKEN}- 토큰 내용으로 직접 넣기` (값에 한글 주석이 붙는 오류) | `${HF_TOKEN:-}` |
| pip 추가 패키지 | websocket 미포함 (step08/step11 ImportError) | `websocket-client` 추가 |
| 볼륨 | 존재하지 않는 `./src` 마운트 | 제거 (DAG 코드는 `dags/` 마운트에 포함) |
