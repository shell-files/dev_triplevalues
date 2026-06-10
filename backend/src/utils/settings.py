import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
  host_ip: str
  domain: str

  # --------------------------
  # kafka config
  # --------------------------
  kafka_server: str = "kafka:9092"
  kafka_topic: str = "tval_email"
  kafka_self_assess_topic: str = "tval_self_assess"

  # --------------------------
  # email config
  # --------------------------
  mail_username: str
  mail_password: str
  mail_from: str
  mail_port: int = 587
  mail_server: str = "smtp.gmail.com"
  mail_from_name: str = "W.I.T.H"
  mail_starttls: bool = True
  mail_ssl_tls: bool = False
  use_credentials: bool = True
  validate_certs: bool = True

  # --------------------------
  # tokenset.py
  # --------------------------
  private_key: str = "secrets/authpr.pem"
  public_key: str = "secrets/authpb.pem"
  access_token_expire_minutes: int
  refresh_token_expire_days: int
  invite_token_expire_days: int

  # --------------------------
  # rediscl.py
  # --------------------------
  redis_host: str
  redis_port: int
  redis_db5: int
  redis_db6: int

  # --------------------------
  # file.py
  # --------------------------
  service_key: str

  # --------------------------
  # ocr.py
  # --------------------------
  ocr_key_path: str = "secrets/ocr_key.json"

  # --------------------------
  # db.py
  # --------------------------
  maria_db_user: str
  maria_db_password: str
  maria_db_host: str
  maria_db_database: str
  maria_db_external: str
  maria_db_port: int
  maria_db_key: str
  cookie_key: str

  # --------------------------
  #  [AI 엔진에서 이식] PostgreSQL (pgvector Storage)
  # --------------------------
  postgres_user: str 
  postgres_password: str
  postgres_host: str 
  postgres_database: str
  postgres_port: int

  # --------------------------
  #  [AI 엔진에서 이식] Models & Ollama / HuggingFace
  # --------------------------
  ollama_host: str
  ai_model: str
  embed_model: str 
  rerank_model: str 
  hf_repo: str


  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
  )

settings = Settings()
