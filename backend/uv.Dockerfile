# compose.yml 의 backend 가 사용하는 uv:1 베이스 이미지
#   docker build -t uv:1 -f backend/uv.Dockerfile backend
# 소스/의존성은 이미지에 넣지 않고 compose 볼륨 마운트 + `uv run` 이 처리한다.
# gcc / libmariadb-dev / libpq-dev: mariadb, psycopg2 패키지 소스 빌드용
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc g++ libmariadb-dev libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /workspace
EXPOSE 8000
