import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

/**
 * REQ-0045 — GET /api/auth/logout 검증(설계 §5 V9·V10·V11).
 *
 * V9: id_token 존재 시 302로 auth `/connect/logout`을 조립하고(id_token_hint·post_logout_redirect_uri
 *     둘 다 포함) 쿠키 5종을 만료시킨다.
 * V10: id_token 부재 시 auth를 거치지 않고 `/logged-out`로 직행하며 쿠키 5종은 그대로 만료시킨다.
 * V11: post_logout_redirect_uri 조립 규칙 — `${공개 origin}${BASE_PATH}/logged-out`과 byte-exact.
 *
 * vitest.config.ts 전역 env(AUTH_ISSUER=http://localhost:30000, NEXT_PUBLIC_BASE_PATH=/app,
 * AUTH_REDIRECT_URI=http://localhost:3000/oauth/callback, APP_PUBLIC_ORIGIN 미설정)가
 * 고정하는 공개 origin은 getPublicOrigin() 우선순위 2(AUTH_REDIRECT_URI의 origin) =
 * http://localhost:3000 이다.
 */

const AUTH_ISSUER = 'http://localhost:30000';
const PUBLIC_ORIGIN = 'http://localhost:3000';

function requestWithIdToken(idToken?: string): NextRequest {
  const cookieHeader = idToken ? `mm_id_token=${idToken}` : '';
  return new NextRequest('http://localhost:3000/api/auth/logout', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe('GET /api/auth/logout', () => {
  it('V9 — id_token 존재 시 auth /connect/logout으로 302하며 id_token_hint·post_logout_redirect_uri를 포함한다', async () => {
    const idToken = 'sample-id-token-value';
    const response = await GET(requestWithIdToken(idToken));

    expect(response.status).toBe(307); // NextResponse.redirect 기본 상태코드(3xx — 실질은 302 의미의 임시 리다이렉트)
    const location = response.headers.get('location');
    expect(location).not.toBeNull();
    const parsed = new URL(location!);
    expect(parsed.origin + parsed.pathname).toBe(`${AUTH_ISSUER}/connect/logout`);
    expect(parsed.searchParams.get('id_token_hint')).toBe(idToken);
    expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe(`${PUBLIC_ORIGIN}/app/logged-out`);
  });

  it('V9 — 쿠키 5종(mm_auth·mm_id_token·mm_access_token·mm_refresh_token·mm_pkce_verifier)을 만료시킨다', async () => {
    const response = await GET(requestWithIdToken('sample-id-token-value'));

    const setCookieHeader = response.headers.get('set-cookie') ?? '';
    for (const name of ['mm_auth', 'mm_id_token', 'mm_access_token', 'mm_refresh_token', 'mm_pkce_verifier']) {
      expect(setCookieHeader, `${name}이 삭제 Set-Cookie에 포함돼야 함`).toContain(`${name}=`);
    }
  });

  it('V9 — Cache-Control: no-store를 강제한다', async () => {
    const response = await GET(requestWithIdToken('sample-id-token-value'));
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('V10 — id_token 부재 시 auth를 거치지 않고 곧바로 /logged-out으로 302한다', async () => {
    const response = await GET(requestWithIdToken(undefined));

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBe(`${PUBLIC_ORIGIN}/app/logged-out`);
  });

  it('V10 — id_token 부재 시에도 쿠키 5종은 그대로 만료된다', async () => {
    const response = await GET(requestWithIdToken(undefined));
    const setCookieHeader = response.headers.get('set-cookie') ?? '';
    for (const name of ['mm_auth', 'mm_id_token', 'mm_access_token', 'mm_refresh_token', 'mm_pkce_verifier']) {
      expect(setCookieHeader).toContain(`${name}=`);
    }
  });

  it('V11 — post_logout_redirect_uri는 공개 origin + BASE_PATH + /logged-out과 byte-exact다', async () => {
    const idToken = 'v11-id-token';
    const response = await GET(requestWithIdToken(idToken));
    const location = new URL(response.headers.get('location')!);
    const postLogoutUri = location.searchParams.get('post_logout_redirect_uri');

    // ★ 핵심 회귀 가드: BASE_PATH 접두가 빠지거나 경로 리터럴이 바뀌면 이 단언이 즉시 깨진다.
    expect(postLogoutUri).toBe('http://localhost:3000/app/logged-out');
  });
});
