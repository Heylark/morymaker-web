import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_ID_TOKEN,
  COOKIE_PKCE,
  COOKIE_REFRESH_TOKEN,
  SESSION_COOKIE_OPTIONS,
  encodeAuthCookie,
} from '@/lib/cookies';
import { extractEmail, extractRoles } from '@/lib/tokens';

interface PkceCookiePayload {
  verifier: string;
  state: string;
  returnTo: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
}

/** 로그인 재개시로 되돌리며 PKCE 임시 쿠키를 정리한다(전 구간 fail-closed 공통 경로). */
function redirectToLoginRetry(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/oauth/login', request.url));
  response.cookies.set(COOKIE_PKCE, '', { ...COOKIE_EXPIRE_OPTIONS, maxAge: 0 });
  return response;
}

/** 인증 실패 시 발급된 쿠키를 전부 삭제하고 로그인으로 되돌린다. */
function redirectToLoginWithCleanup(request: NextRequest): NextResponse {
  const response = redirectToLoginRetry(request);
  response.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  response.cookies.set(COOKIE_ID_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  response.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  response.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  return response;
}

/**
 * GET /oauth/callback — PKCE 인가 코드를 토큰으로 교환한다.
 *
 * auth가 requireProofKey(true)를 강제하므로 code_verifier 없는 교환은 invalid_grant로 거부된다.
 * 전 구간 fail-closed — 어느 단계든 실패하면 발급된 쿠키를 정리하고 로그인으로 되돌린다.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const queryState = request.nextUrl.searchParams.get('state');
  const errorParam = request.nextUrl.searchParams.get('error');

  if (errorParam || !code) {
    console.warn(`[OAuth Callback] 인가 실패 또는 code 누락: error=${errorParam}`);
    return redirectToLoginRetry(request);
  }

  // mm_pkce_verifier 쿠키 읽기 — 없으면 개시 단계부터 다시 (만료/다른 탭 덮어쓰기 등)
  const pkceCookie = request.cookies.get(COOKIE_PKCE)?.value;
  if (!pkceCookie) {
    console.warn('[OAuth Callback] mm_pkce_verifier 쿠키 없음');
    return redirectToLoginRetry(request);
  }

  let pkcePayload: PkceCookiePayload;
  try {
    pkcePayload = JSON.parse(pkceCookie);
  } catch {
    console.warn('[OAuth Callback] mm_pkce_verifier 쿠키 파싱 실패');
    return redirectToLoginRetry(request);
  }

  // CSRF 방어 — 콜백 쿼리 state가 개시 시점에 쿠키로 보존한 state와 일치해야 한다
  if (pkcePayload.state !== queryState) {
    console.warn('[OAuth Callback] state 불일치 (CSRF 의심 또는 만료된 세션)');
    return redirectToLoginRetry(request);
  }

  // 토큰 교환
  let tokenData: TokenResponse;
  try {
    const credentials = Buffer.from(
      `${process.env.AUTH_CLIENT_ID}:${process.env.AUTH_CLIENT_SECRET}`,
    ).toString('base64');
    const tokenRes = await fetch(new URL('/oauth2/token', process.env.AUTH_ISSUER), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // redirect_uri는 개시 요청(authorize)과 byte-동일해야 한다 — auth가 재검증한다.
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.AUTH_REDIRECT_URI ?? '',
        code_verifier: pkcePayload.verifier,
      }),
      cache: 'no-store',
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error(`[OAuth Callback] 토큰 교환 실패: ${tokenRes.status} ${errorBody}`);
      return redirectToLoginWithCleanup(request);
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error('[OAuth Callback] 토큰 교환 네트워크 오류:', err);
    return redirectToLoginWithCleanup(request);
  }

  const { access_token: accessToken, refresh_token: refreshToken, id_token: idToken } = tokenData;
  if (!accessToken || !refreshToken || !idToken) {
    console.error('[OAuth Callback] 토큰 응답에 필수 필드 누락');
    return redirectToLoginWithCleanup(request);
  }

  // 클레임 추출(서명 미검증 — web은 Resource Server가 아니다. UI 힌트 용도)
  const email = extractEmail(idToken);
  const roles = extractRoles(accessToken);

  const returnTo = pkcePayload.returnTo || '/console';
  const response = NextResponse.redirect(new URL(returnTo, request.url));

  // mm_pkce_verifier는 여기서 최종 삭제(one-time use) — 교환 성공/실패 모든 경로에서 정리됨
  response.cookies.set(COOKIE_PKCE, '', { ...COOKIE_EXPIRE_OPTIONS, maxAge: 0 });
  response.cookies.set(COOKIE_AUTH, encodeAuthCookie({ username: email, roles }), SESSION_COOKIE_OPTIONS);
  response.cookies.set(COOKIE_ID_TOKEN, idToken, SESSION_COOKIE_OPTIONS);
  response.cookies.set(COOKIE_ACCESS_TOKEN, accessToken, SESSION_COOKIE_OPTIONS);
  response.cookies.set(COOKIE_REFRESH_TOKEN, refreshToken, SESSION_COOKIE_OPTIONS);

  return response;
}
