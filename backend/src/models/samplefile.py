# ── 아래 코드를 src/apis/company.py 파일 끝에 추가해 주세요 ──

from fastapi.responses import FileResponse
from pathlib import Path
from urllib.parse import quote

@router.get("/file/sample/{filename}",
    summary="양식 파일 다운로드 (sampleFiles 폴더)",
    description="자가진단 체크리스트(.xlsx) 및 행동강령(.pdf) 양식 다운로드")
def downloadSampleFile(filename: str):
    filePath = Path("sampleFiles") / filename
    if not filePath.exists():
        return responseModel(False, f"파일을 찾을 수 없습니다: {filename}")
    encoded = quote(filename)
    return FileResponse(
        path=str(filePath),
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded}"}
    )
