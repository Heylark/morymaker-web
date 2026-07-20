/**
 * 공개(브라우저 도달) origin 도출 — Next standalone의 request.url이 bind 주소(0.0.0.0)로
 * 오인식되는 배포 토폴로지에서 절대 리다이렉트·쿠키 secure 판정의 신뢰 origin 소스.
 *
 * ⚠️ forwarded 헤더(x-forwarded-host/-proto)는 의도적으로 읽지 않는다 — 리다이렉트 origin·
 *    쿠키 secure 같은 보안 민감 결정을 위조 가능한 요청 헤더에 근거시키면 공격자가
 *    호스트 헤더를 조작해 인가 코드를 외부 origin으로 흘리는 open-redirect 표면이 생긴다.
 *    유일한 신뢰 근거는 배포 시 운영자가 심는 env(위조 표면 0)다.
 *
 * 우선순위(모두 배포 env):
 *   1) APP_PUBLIC_ORIGIN  (옵션 명시 오버라이드)
 *   2) AUTH_REDIRECT_URI 의 origin  (필수 env — OIDC 콜백 origin은 브라우저가 실제 도달하는
 *      공개 origin과 동일해야 인가 흐름이 성립하므로, 신규 env 없이 그대로 재사용한다)
 *   3) fallbackUrl 의 origin  (로컬 dev 최종 안전망 — 위 두 env가 전무·malformed일 때만)
 */
export function getPublicOrigin(fallbackUrl?: string): string {
  const candidates = [process.env.APP_PUBLIC_ORIGIN, process.env.AUTH_REDIRECT_URI, fallbackUrl];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      // malformed 값 — 다음 우선순위로 폴백
    }
  }

  // 세 후보가 전부 없거나 malformed인 경우의 최종 안전망. AUTH_REDIRECT_URI는 OIDC 교환에
  // 필수인 env라 실 배포·로컬 dev 어디서도 비어있지 않으므로 이 줄은 실질적으로 도달하지 않는다.
  return 'http://localhost:3000';
}

/** 공개 origin scheme이 https 인가 — 쿠키 secure 판정용(모듈 로드 시점, request 없음). */
export function isPublicSecure(): boolean {
  return getPublicOrigin().startsWith('https://');
}
