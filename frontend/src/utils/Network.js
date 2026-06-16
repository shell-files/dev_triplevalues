import axios from 'axios'

/**
 * [v1.2] 설정 초기화
 * - baseURL: BE 서버 직접 호출
 * - withCredentials: CORS 쿠키 전송
 * - X-Token-UUID: 세션 식별용 헤더 자동 첨부 (document.cookie에서 읽기)
 * 
 * 설정 초기화 함수
 * 토큰이 존재할 경우 Authorization 헤더를 자동으로 추가합니다.
 */
const initConfig = (type) => {
	let baseURL = import.meta.env.VITE_API_URL_TV || "http://localhost:8000";
	const headers = {
		"Content-Type": "application/json",
	}
  if (type) {
    headers["Content-Type"] = "multipart/form-data";
  }
	// const token = localStorage.getItem('token');
  // if (token) {
  //   headers["Authorization"] = `Bearer ${token}`;
  // }

  /* [v1.2] document.cookie에서 tokenUuid 읽어 헤더에 자동 첨부 */
  const tokenUuid = document.cookie.split('; ').find(c => c.startsWith('esg_token='))?.split('=')[1];
  if (tokenUuid) {
    headers["X-Token-UUID"] = tokenUuid;
  }

	return {
		baseURL,
		withCredentials: true,
		headers,
	}
}

/**
 * 공통 요청 함수 (Wrapper)
 * 중복되는 try-catch 블록을 제거하여 유지보수를 용이하게 합니다.
 */
const request = async (config) => {
  try {
    const response = await axios(config);
    return response.data;
  } catch (err) {
    // console.error(`[API Error]: ${err.message}`);
    return { status: false, error: err.response?.data || err.message };
  }
}

// 각 Method 정의
export const GET = (url, params) =>
  request({ ...initConfig(), method: 'GET', url, params });

export const POST = (url, data, type) =>
  request({ ...initConfig(type), method: 'POST', url, data });

export const PUT = (url, data) =>
  request({ ...initConfig(), method: 'PUT', url, data });

export const PATCH = (url, data) =>
  request({ ...initConfig(), method: 'PATCH', url, data });

export const DELETE = (url) =>
  request({ ...initConfig(), method: 'DELETE', url });
