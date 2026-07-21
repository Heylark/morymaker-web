import { NextRequest, NextResponse } from 'next/server';
import { createPkcePair, createState } from '@/lib/pkce';
import { COOKIE_AUTH, COOKIE_PKCE, PKCE_COOKIE_OPTIONS, decodeAuthCookieNode } from '@/lib/cookies';
import { safeReturnTo } from '@/lib/return-to';
import { BASE_PATH } from '@/lib/base-path';
import { getPublicOrigin } from '@/lib/public-origin';

/**
 * GET /oauth/login — PKCE 로그인 개시.
 *
 * Server Component가 아니라 Route Handler인 이유: Server Component는 쿠키를 set할 수 없는데,
 * 이 단계는 verifier/state를 콜백까지 들고 가기 위한 쿠키 set이 필수다.
 */
export async function GET(request: NextRequest) {
  // 쿠키에 넣기 전 동일 오리진 상대경로인지 검증(저장 시점 1차 방어) — 위반 시 랜딩으로 안전 폴백
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  // 로그인됨 단락(§4 시나리오5 / ADR-011 / ADR-022) — `?prompt=login`이면 건너뛴다(재로그인
  // 탈출구: mm_auth는 유효한데 access/refresh 토큰이 죽어 새 토큰이 필요한 경우를 위한 것이지,
  // 계정 전환·강제 재인증 수단이 아니다 — SAS 1.x는 prompt를 재인증 트리거로 쓰지 않는다).
  const promptLogin = request.nextUrl.searchParams.get('prompt') === 'login';
  if (!promptLogin) {
    const authCookie = request.cookies.get(COOKIE_AUTH)?.value;
    const payload = authCookie ? decodeAuthCookieNode(authCookie) : null;
    if (payload) {
      // ⚠️ 이 라우트는 Route Handler라 basePath가 자동으로 붙지 않는다(Server Component
      // redirect()와 반대 — ADR-022). BASE_PATH 수동 접두 + getPublicOrigin으로 리버스
      // 프록시 뒤 standalone에서도 브라우저가 실제 도달하는 공개 origin으로 리다이렉트한다.
      return NextResponse.redirect(
        new URL(`${BASE_PATH}${returnTo}`, getPublicOrigin(request.url)),
      );
    }
  }

  const { verifier, challenge } = await createPkcePair();
  const state = createState();

  const authorizeUrl = new URL('/oauth2/authorize', process.env.AUTH_ISSUER);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', process.env.AUTH_CLIENT_ID ?? '');
  authorizeUrl.searchParams.set('redirect_uri', process.env.AUTH_REDIRECT_URI ?? '');
  authorizeUrl.searchParams.set('scope', 'openid email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    COOKIE_PKCE,
    JSON.stringify({ verifier, state, returnTo }),
    PKCE_COOKIE_OPTIONS,
  );
  return response;
}
