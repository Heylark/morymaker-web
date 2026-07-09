/**
 * api(Resource Server) 업스트림 base — host root(경로 접미사 없음).
 * BFF 프록시가 클라 요청 경로(api-절대경로, 예: 'api/events')를 그대로 이어붙인다
 * (`API_BASE_URL` + '/' + 'api/events' = 'http://localhost:30100/api/events').
 * 서버 전용 — 브라우저 번들에 노출하지 않는다(NEXT_PUBLIC_ prefix 없음).
 */
export const API_BASE = process.env.API_BASE_URL;
