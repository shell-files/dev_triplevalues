import re
import sys

# =====================================================================
# ➕ [AI 엔진에서 이식] 엔진 구동에 필수적인 공유 유틸리티 함수 레이어
# =====================================================================

def safePrint(*args, sep=" ", end="\n", **kwargs) -> None:
    """인코딩 깨짐을 방지하고 터미널에 안전하게 로그를 출력하는 함수"""
    file = kwargs.get("file", sys.stdout)
    text = sep.join(str(a) for a in args)
    try:
        file.write(text + end)
        file.flush()
    except UnicodeEncodeError:
        enc = getattr(file, "encoding", "utf-8") or "utf-8"
        file.write(text.encode(enc, errors="replace").decode(enc) + end)
        file.flush()


def simpleTokenizer(text: str) -> list[str]:
    """BM25 검색 알고리즘을 위한 알파벳/숫자 기반 간단 토크나이저"""
    if not text:
        return []
    return re.sub(r"[^\w\s]", " ", text.lower()).split()


def checkAndPullOllamaModel(ollamaClient, modelName: str) -> None:
    """Ollama 로컬 모델 설치 상태를 검사하고, 없으면 자동으로 pull하는 함수"""
    safePrint(f"[조회] Ollama 모델 '{modelName}' 로컬 설치 상태 검사 중...")
    try:
        modelsList = ollamaClient.list()
        downloaded = []
        for m in modelsList.get("models", []):
            name = m.get("model", m.get("name", ""))
            downloaded.append(name)
            if ":" in name:
                downloaded.append(name.split(":")[0])

        if not any(modelName == m or modelName in m or m in modelName for m in downloaded):
            safePrint(f"[알림] 로컬에 '{modelName}' 모델이 발견되지 않아 다운로드를 시작합니다. 시간이 다소 소요될 수 있습니다.")
            ollamaClient.pull(modelName)
            safePrint(f"[완료] '{modelName}' 모델 다운로드 완료.")
        else:
            safePrint(f"[확인] 로컬에 '{modelName}' 모델이 이미 준비되어 있습니다.")
    except Exception as e:
        safePrint(f"[경고] Ollama 모델 상태 확인 중 예외가 발생했으나 프로세스를 계속 진행합니다: {e}")