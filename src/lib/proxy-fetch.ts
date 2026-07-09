/**
 * BFF 프록시 fetch 헬퍼(클라 컴포넌트 전용) — `/api/proxy/` prefix를 자동으로 붙인다.
 *
 * HttpOnly 쿠키(mm_access_token)는 브라우저 JS가 읽을 수 없으므로, 인증이 필요한 호출은
 * 이 헬퍼를 거쳐 프록시 Route Handler가 대신 Bearer 헤더를 부착하게 한다.
 *
 * @param path api-절대경로('api/events' 형태 — 앞 슬래시 유무 무관). 3분법 판정이 이 경로에
 *             그대로 적용되므로 Spring matcher(`/api/public/**` 등)와 문자 그대로 일치해야 한다.
 */
export function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.replace(/^\//, '');
  return fetch(`/api/proxy/${normalizedPath}`, init);
}
