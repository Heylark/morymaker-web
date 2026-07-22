import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_AUTH } from '@/lib/cookie-names';
import { safeReturnTo } from '@/lib/return-to';
import { BASE_PATH } from '@/lib/base-path';

/**
 * Edge Runtime 인증 게이트 — 프로젝트 최초 도입(§1 시나리오3·4). 딥링크 진입 시 정확한 원래
 * 경로를 `returnTo`로 붙여 로그인으로 보낸다(레이아웃 게이트만으로는 canonical 경로로만
 * 복귀할 수 있다 — 실제 요청 경로를 모르기 때문).
 *
 * ⚠️ **쿠키 존재 여부만 확인한다 — HMAC 검증도 역할 판정도 하지 않는다**.
 * Edge에서 HMAC 검증을 하려면 AUTH_HMAC_SECRET이 Edge 런타임에 도달해야 하는데, 시크릿이
 * 비면 `decodeAuthCookieEdge`가 fail-closed로 항상 null을 반환해 `/landing → /oauth/login →
 * (Node에서는 세션 유효라 단락) → /landing → …` 무한 루프가 된다. 위조 쿠키를 들고 통과해도
 * 곧바로 layout 서버 게이트(`decodeAuthCookieNode`, HMAC 검증)가 UNAUTHENTICATED로 판정해
 * 로그인으로 되돌리므로 인가 경계는 조금도 이동하지 않는다 — 위조자가 얻는 것은 "returnTo가
 * canonical 경로가 되는 것"뿐이다.
 *
 * import는 순수 모듈 3개뿐이다(`cookie-names`·`return-to`·`base-path`) — `@/lib/cookies`는
 * `node:crypto`를 top-level import하므로 여기서 절대 import하지 않는다.
 */
export function middleware(request: NextRequest) {
  const hasAuthCookie = request.cookies.has(COOKIE_AUTH);
  if (hasAuthCookie) {
    return NextResponse.next();
  }

  // request.nextUrl.pathname/search는 basePath가 이미 strip된 앱 좌표계다 — safeReturnTo·PKCE
  // 쿠키·callback과 좌표계가 일치한다.
  const returnTo = safeReturnTo(`${request.nextUrl.pathname}${request.nextUrl.search}`);

  // 외부 좌표계로 나가는 리다이렉트 URL이라 BASE_PATH 수동 접두가 필수다 —
  // middleware의 NextResponse.redirect는 basePath를 자동으로 붙이지 않는다.
  const loginUrl = new URL(`${BASE_PATH}/oauth/login`, request.url);
  // searchParams.set이 인코딩을 담당한다 — 수동 encodeURIComponent 이중 적용 금지.
  loginUrl.searchParams.set('returnTo', returnTo);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 보호 대상 5개 접두사만 나열하는 화이트리스트다. 부정 정규식은 게스트·키오스크
  // 표면(/r,/p,/u,/kiosk,/visitor — 로그인 개념이 없는 사업상 핵심 익명 경로)을 실수로 가로챌
  // 위험이 있다 — 신규 공개 경로가 추가될 때마다 예외를 빠뜨리면 QR 방문자가 로그인으로
  // 튕기는 치명적 실패가 난다. 화이트리스트는 누락돼도 layout 게이트가 받으므로 실패 방향이
  // 안전한 쪽이다.
  matcher: ['/landing/:path*', '/console/:path*', '/events/:path*', '/accounts/:path*', '/staff/:path*'],
};
