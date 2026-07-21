import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { COOKIE_PKCE } from '@/lib/cookies';

/**
 * 리버스 프록시 뒤 Next standalone에서 request.url이 컨테이너 bind 주소(0.0.0.0)로 오인식되어
 * 실서버 로그인이 전면 실패했던 버그의 회귀 봉인 — 콜백 리다이렉트 origin이 request.url이
 * 아니라 getPublicOrigin()(AUTH_REDIRECT_URI 기반)에서 도출됨을 실 GET 핸들러 실행으로 증명한다.
 *
 * cookies.ts의 SECURE 상수·base-path.ts의 BASE_PATH 상수는 module-load 시점 env를 1회
 * 캐시하므로(모듈 로드 시점에 상수가 고정되는 타이밍 주의),
 * AUTH_REDIRECT_URI를 바꿔 검증하는 케이스마다 vi.resetModules() 후 동적 import로 fresh 모듈을
 * 얻는다. vitest.config.ts 전역 env가 NEXT_PUBLIC_BASE_PATH=/app 를 이미 심어두므로 BASE_PATH는
 * 모든 케이스에서 '/app'로 고정된다.
 */

const PUBLIC_ORIGIN = 'https://mm.i-commtech.co.kr';
// 실서버 재현 — Next standalone이 request.url을 자기 bind 주소로 오인식하는 상황을 그대로 흉내낸다.
const POLLUTED_ORIGIN = 'http://0.0.0.0:50000';

function jwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

function pkceCookieHeader(payload: { verifier: string; state: string; returnTo: string }): string {
  return `${COOKIE_PKCE}=${encodeURIComponent(JSON.stringify(payload))}`;
}

function mockTokenExchange() {
  vi.stubGlobal('fetch', vi.fn());
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: jwt({ exp: Math.floor(Date.now() / 1000) + 3600, roles: ['SYSTEM_ADMIN'] }),
        refresh_token: 'refresh-token-value',
        id_token: jwt({ email: 'admin@morymaker.local' }),
      }),
      { status: 200 },
    ),
  );
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /oauth/callback — 공개 origin 리다이렉트 (회귀 봉인)', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_REDIRECT_URI', `${PUBLIC_ORIGIN}/app/oauth/callback`);
  });

  it('성공 경로 — request.url이 0.0.0.0 오염이어도 리다이렉트가 공개 origin으로 조립된다(0.0.0.0 0건)', async () => {
    mockTokenExchange();
    const { GET } = await import('./route');

    const state = 'state-success-1';
    const request = new NextRequest(`${POLLUTED_ORIGIN}/app/oauth/callback?code=auth-code-1&state=${state}`, {
      headers: { Cookie: pkceCookieHeader({ verifier: 'v', state, returnTo: '/console' }) },
    });
    const response = await GET(request);
    const location = response.headers.get('location');

    expect(location).toBe(`${PUBLIC_ORIGIN}/app/console`);
    expect(location).not.toContain('0.0.0.0');
  });

  it('fail-closed(PKCE 쿠키 없음) 경로 — request.url이 0.0.0.0 오염이어도 재시도 리다이렉트가 공개 origin으로 조립된다(0.0.0.0 0건)', async () => {
    const { GET } = await import('./route');

    const request = new NextRequest(`${POLLUTED_ORIGIN}/app/oauth/callback?code=auth-code-2&state=state-x`);
    const response = await GET(request);
    const location = response.headers.get('location');

    expect(location).toBe(`${PUBLIC_ORIGIN}/app/oauth/login`);
    expect(location).not.toContain('0.0.0.0');
  });

  it('PKCE 왕복 — login이 발급한 쿠키가 콜백에서 인식되어 "쿠키 없음" 재시도 분기를 우회한다', async () => {
    mockTokenExchange();
    const { GET: loginGET } = await import('../login/route');
    const { GET: callbackGET } = await import('./route');

    const loginResponse = await loginGET(new NextRequest(`${PUBLIC_ORIGIN}/app/oauth/login`));
    const pkceCookie = loginResponse.cookies.get(COOKIE_PKCE);
    expect(pkceCookie).toBeDefined();
    const { state } = JSON.parse(pkceCookie!.value) as { state: string };

    const callbackRequest = new NextRequest(
      `${POLLUTED_ORIGIN}/app/oauth/callback?code=auth-code-3&state=${state}`,
      { headers: { Cookie: `${COOKIE_PKCE}=${encodeURIComponent(pkceCookie!.value)}` } },
    );
    const response = await callbackGET(callbackRequest);

    // "쿠키 없음" 재시도였다면 착지가 /app/oauth/login이었을 것 — 성공 경로(기본 returnTo=/landing,
    // ADR-012) 도달로 콜백이 login 발급 쿠키를 실제로 인식했음을 확인한다.
    expect(response.headers.get('location')).toBe(`${PUBLIC_ORIGIN}/app/landing`);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('공개 scheme이 https일 때 세션·PKCE 쿠키에 Secure 속성이 부여된다', async () => {
    mockTokenExchange();
    const { COOKIE_ACCESS_TOKEN, COOKIE_AUTH } = await import('@/lib/cookies');
    const { GET } = await import('./route');

    const state = 'state-secure-1';
    const request = new NextRequest(`${POLLUTED_ORIGIN}/app/oauth/callback?code=auth-code-4&state=${state}`, {
      headers: { Cookie: pkceCookieHeader({ verifier: 'v', state, returnTo: '/console' }) },
    });
    const response = await GET(request);

    expect(response.cookies.get(COOKIE_AUTH)?.secure).toBe(true);
    expect(response.cookies.get(COOKIE_ACCESS_TOKEN)?.secure).toBe(true);
    expect(response.cookies.get(COOKIE_PKCE)?.secure).toBe(true); // 1회용 정리(clear)도 동일 옵션을 상속
  });
});

describe('GET /oauth/callback — 로컬 dev 무영향 (value-preserving)', () => {
  // vitest.config.ts 전역 env(AUTH_REDIRECT_URI=http://localhost:3000/oauth/callback)를 그대로
  // 사용한다 — stub 없음. 이 describe 블록에 한해 안 A의 최종 폴백 경로(로컬 dev)를 검증한다.

  it('리다이렉트가 localhost origin으로 조립되고 Secure 쿠키는 false(http)로 보존된다', async () => {
    mockTokenExchange();
    const { COOKIE_ACCESS_TOKEN } = await import('@/lib/cookies');
    const { GET } = await import('./route');

    const state = 'state-dev-1';
    const request = new NextRequest(`http://localhost:3000/app/oauth/callback?code=auth-code-5&state=${state}`, {
      headers: { Cookie: pkceCookieHeader({ verifier: 'v', state, returnTo: '/console' }) },
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe('http://localhost:3000/app/console');
    expect(response.cookies.get(COOKIE_ACCESS_TOKEN)?.secure).toBe(false);
  });
});
