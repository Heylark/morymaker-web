import { NextRequest, NextResponse } from 'next/server';
import { createPkcePair, createState } from '@/lib/pkce';
import { COOKIE_PKCE, PKCE_COOKIE_OPTIONS } from '@/lib/cookies';
import { safeReturnTo } from '@/lib/return-to';

/**
 * GET /oauth/login — PKCE 로그인 개시.
 *
 * Server Component가 아니라 Route Handler인 이유: Server Component는 쿠키를 set할 수 없는데,
 * 이 단계는 verifier/state를 콜백까지 들고 가기 위한 쿠키 set이 필수다.
 */
export async function GET(request: NextRequest) {
  // 쿠키에 넣기 전 동일 오리진 상대경로인지 검증(저장 시점 1차 방어) — 위반 시 콘솔 화면으로 안전 폴백
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));

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
