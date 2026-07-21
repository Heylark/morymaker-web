/**
 * 쿠키 이름 상수 (5종, mm_ prefix) — Edge 안전 경계.
 *
 * `cookies.ts`에서 분리한 이유: 그 파일은 `node:crypto`를 top-level import한다(HMAC 서명·검증).
 * `middleware.ts`(Edge Runtime)는 존재 여부만 확인하면 되므로 이름 상수만 필요한데, `cookies.ts`를
 * 그대로 import하면 Edge 번들에 Node 전용 모듈이 딸려 들어가 빌드가 실패한다. 이 파일은 상수
 * 리터럴만 담아 어떤 런타임에서도 안전하게 import된다.
 *
 * mm_pkce_verifier: 로그인 개시~콜백 사이 PKCE verifier/state/returnTo를 임시 보존한다(무서명 — 위조되어도
 * 교환 실패만 유발할 뿐 인가를 우회하지 못한다. state가 CSRF를 방어한다).
 * mm_auth: 게이트·화면 표시용 사용자 정보 — 위조 시 역할 상승으로 이어지므로 HMAC 서명 대상이다.
 * mm_id_token/mm_access_token/mm_refresh_token: JWT 자체가 서명돼 있어 별도 봉투 서명이 없다.
 */
export const COOKIE_PKCE = 'mm_pkce_verifier';
export const COOKIE_AUTH = 'mm_auth';
export const COOKIE_ID_TOKEN = 'mm_id_token';
export const COOKIE_ACCESS_TOKEN = 'mm_access_token';
export const COOKIE_REFRESH_TOKEN = 'mm_refresh_token';
