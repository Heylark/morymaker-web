/**
 * returnTo 값을 동일 오리진 상대경로로 정규화하는 단일 진실 소스 — 오픈 리다이렉트 방어.
 *
 * 로그인 개시(저장 전)와 콜백(리다이렉트 전) 양쪽에서 반드시 호출한다. PKCE 임시 쿠키는
 * 무서명(값 자체를 신뢰하지 않음)이라 저장 시점 검증만으로는 부족하고, 사용 직전 재검증이
 * 최종 방어선이다. 위반 시 예외를 던지지 않고 안전 디폴트로 폴백해 로그인 흐름을 보존한다.
 *
 * 안전 판정 6단계(순서 유지 — 앞 단계가 뒷 단계 전제를 만든다):
 *   1. 존재 + 문자열 타입
 *   2. `/`로 시작 — 절대 URL(`https://evil.com`)과 빈 값 모두 여기서 걸러진다
 *   3. `//`로 시작 — 프로토콜 상대 URL(`//evil.com`)은 브라우저가 현재 스킴을 붙여 외부로 나간다
 *   4. `\`(백슬래시) 포함 — 특수 스킴 URL 파서가 백슬래시를 슬래시로 정규화해 `/\evil.com`이
 *      `//evil.com`과 동일하게 해석될 수 있다
 *   5. `:` 포함 — 스킴으로 해석될 수 있는 값을 원천 차단
 *   6. 고정 더미 오리진에 대해 resolve한 결과의 오리진이 그대로인지 확인 — 위 문자열 검사를
 *      우회하는 정규화(예: URL 파서가 파싱 전 제거하는 탭·개행 문자를 끼워 넣어 `//`를
 *      재조립하는 값)까지 URL 파서 기준으로 최종 판정한다
 */

export const DEFAULT_RETURN_TO = '/landing';

const RETURN_TO_GUARD_ORIGIN = 'https://mm-returnto-guard.invalid';

export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_RETURN_TO;
  if (!raw.startsWith('/')) return DEFAULT_RETURN_TO;
  if (raw.startsWith('//')) return DEFAULT_RETURN_TO;
  if (raw.includes('\\')) return DEFAULT_RETURN_TO;
  if (raw.includes(':')) return DEFAULT_RETURN_TO;

  try {
    const resolved = new URL(raw, RETURN_TO_GUARD_ORIGIN);
    if (resolved.origin !== RETURN_TO_GUARD_ORIGIN) return DEFAULT_RETURN_TO;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}
