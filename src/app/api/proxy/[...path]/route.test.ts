import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockCookieStore = { get: vi.fn() };

// Route Handler 실행은 Next.js가 요청마다 세팅하는 AsyncLocalStorage 컨텍스트에 의존한다 —
// 유닛 테스트에는 그 컨텍스트가 없어 next/headers를 직접 mock한다.
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

describe('BFF 프록시 — /api/proxy/[...path]', () => {
  beforeEach(() => {
    mockCookieStore.get.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('PUBLIC 경로 — 토큰이 있어도 Authorization 헤더를 부착하지 않는다', async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'mm_access_token') return { value: 'irrelevant-for-public' };
      return undefined;
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/public/x');
    const response = await GET(request, { params: Promise.resolve({ path: ['api', 'public', 'x'] }) });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('PRIVATE 미인증 — 상류(api) 호출 없이 즉시 401을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue(undefined); // mm_access_token 부재

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
    const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('PUBLIC POST — 요청 본문을 upstream에 그대로 전달한다 (공개 쓰기 body 도달)', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { plate: '12가3456', message: '등록되었습니다' } }), { status: 200 }),
    );

    const { POST } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/public/u/tok1/prereg-plate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate: '12가3456' }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ path: ['api', 'public', 'u', 'tok1', 'prereg-plate'] }),
    });

    expect(response.status).toBe(200);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(Buffer.from(init?.body as Buffer).toString()).toBe(JSON.stringify({ plate: '12가3456' }));
  });

  it('PUBLIC 응답 — Cache-Control: no-store를 강제한다 (개인정보 공개 GET 캐시 누출 방지)', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/public/u/tok1');
    const response = await GET(request, { params: Promise.resolve({ path: ['api', 'public', 'u', 'tok1'] }) });

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('PRIVATE POST — PUBLIC prefix 밖의 비공개 쓰기는 여전히 미인증 401로 차단한다 (변경 경계 봉인)', async () => {
    mockCookieStore.get.mockReturnValue(undefined); // mm_access_token 부재

    const { POST } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/events', {
      method: 'POST',
      body: JSON.stringify({ name: '테스트' }),
    });
    const response = await POST(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('PRIVATE 인증됨 — Authorization: Bearer 헤더를 부착해 상류를 호출한다', async () => {
    // exp를 먼 미래로 설정해 만료 판정(proactive refresh)을 건너뛰게 한다.
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ exp: futureExp, roles: ['SYSTEM_ADMIN'] })).toString('base64url');
    const token = `${header}.${body}.sig`;

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'mm_access_token') return { value: token };
      return undefined;
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
    const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
  });

  describe('auth 라우팅 확장 — api/accounts는 API_BASE(api 30100) 대신 AUTH_API_BASE(auth 30000)로 분기', () => {
    function authenticatedToken(): string {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({ exp: futureExp, roles: ['SYSTEM_ADMIN'] })).toString('base64url');
      return `${header}.${body}.sig`;
    }

    it('api/accounts — AUTH_API_BASE(auth 30000)로 업스트림 URL이 조립된다', async () => {
      const token = authenticatedToken();
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'mm_access_token') return { value: token };
        return undefined;
      });
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/accounts');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'accounts'] }) });

      expect(response.status).toBe(200);
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('http://localhost:30000/api/accounts');
    });

    it('api/accounts/{id} 하위 경로도 AUTH_API_BASE로 라우팅된다(경계 매칭 — startsWith prefix+"/")', async () => {
      const token = authenticatedToken();
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'mm_access_token') return { value: token };
        return undefined;
      });
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/accounts/acc-1');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'accounts', 'acc-1'] }) });

      expect(response.status).toBe(200);
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('http://localhost:30000/api/accounts/acc-1');
    });

    it('api/accounts-x 같은 유사 경로는 오매칭 없이 API_BASE(api 30100)로 유지된다(경계 매칭)', async () => {
      const token = authenticatedToken();
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'mm_access_token') return { value: token };
        return undefined;
      });
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/accounts-x');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'accounts-x'] }) });

      expect(response.status).toBe(200);
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('http://localhost:30100/api/accounts-x');
    });
  });

  describe('REQ-0045 V8/V8-a/V8-c — id_token 회전(§3-1) 및 unauthorizedResponse 대칭', () => {
    /** exp=과거 → isTokenExpired가 즉시 만료로 판정(proactive refresh 강제). */
    function expiredToken(): string {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({ exp: 1, roles: ['SYSTEM_ADMIN'] })).toString('base64url');
      return `${header}.${body}.sig`;
    }

    function futureToken(): string {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({ exp: futureExp, roles: ['SYSTEM_ADMIN'] })).toString('base64url');
      return `${header}.${body}.sig`;
    }

    /** oauth2/token 엔드포인트만 성공 응답 — 그 외 URL은 개별 테스트가 mockImplementationOnce로 이어붙인다. */
    function mockTokenEndpointOnce(newAccessToken: string, newRefreshToken: string, newIdToken: string) {
      vi.mocked(fetch).mockImplementationOnce((url) => {
        expect(String(url)).toContain('/oauth2/token');
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: newAccessToken, refresh_token: newRefreshToken, id_token: newIdToken }),
            { status: 200 },
          ),
        );
      });
    }

    function setCookies(oldAccessToken: string, oldIdToken = 'old-id-token-value') {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'mm_access_token') return { value: oldAccessToken };
        if (name === 'mm_refresh_token') return { value: 'old-refresh-token-value' };
        if (name === 'mm_id_token') return { value: oldIdToken };
        return undefined;
      });
    }

    it('V8 — proactive refresh 성공 시 mm_id_token Set-Cookie가 새 id_token과 정확히 일치하고 옛 값과 다르다', async () => {
      setCookies(expiredToken(), 'old-id-token-value');
      mockTokenEndpointOnce('new-access-token', 'new-refresh-token', 'new-id-token-value');
      // 두 번째 fetch(업스트림 실호출)
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(200);
      const idTokenCookie = response.cookies.get('mm_id_token');
      expect(idTokenCookie?.value, 'mm_id_token 쿠키가 새 id_token과 정확히 일치해야 함').toBe('new-id-token-value');
      expect(idTokenCookie?.value, 'mm_id_token은 회전 전 옛 값과 달라야 함').not.toBe('old-id-token-value');
      expect(response.cookies.get('mm_access_token')?.value).toBe('new-access-token');
      expect(response.cookies.get('mm_refresh_token')?.value).toBe('new-refresh-token');
    });

    it('V8 — reactive refresh(1차 401 → 재시도) 성공 시에도 mm_id_token Set-Cookie가 새 값과 일치한다', async () => {
      // exp 먼 미래로 두어 proactive 분기를 건너뛰고, 업스트림이 401을 줘 reactive 경로를 태운다.
      setCookies(futureToken(), 'old-id-token-value');
      vi.mocked(fetch).mockImplementationOnce((url) => {
        expect(String(url)).not.toContain('/oauth2/token');
        return Promise.resolve(new Response(JSON.stringify({ error: 'expired' }), { status: 401 }));
      });
      mockTokenEndpointOnce('reactive-access', 'reactive-refresh', 'reactive-id-token');
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(200);
      const idTokenCookie = response.cookies.get('mm_id_token');
      expect(idTokenCookie?.value).toBe('reactive-id-token');
      expect(idTokenCookie?.value).not.toBe('old-id-token-value');
    });

    it('V8-a — proactive 회전 성공 직후 요청 본문 읽기 실패(400)에도 회전 쿠키 3종이 실린다', async () => {
      setCookies(expiredToken());
      mockTokenEndpointOnce('a-access', 'a-refresh', 'a-id-token');

      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events', { method: 'POST' });
      // arrayBuffer()가 throw하도록 인스턴스 오버라이드 — 스트림 파손을 흉내낸다.
      vi.spyOn(request, 'arrayBuffer').mockRejectedValue(new Error('stream broken'));

      const response = await POST(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(400);
      expect(response.cookies.get('mm_id_token')?.value, 'body 읽기 실패(400) 응답에도 회전된 id_token이 실려야 함').toBe(
        'a-id-token',
      );
      expect(response.cookies.get('mm_access_token')?.value).toBe('a-access');
      expect(response.cookies.get('mm_refresh_token')?.value).toBe('a-refresh');
    });

    it('V8-a — proactive 회전 성공 직후 업스트림 연결 실패(502)에도 회전 쿠키 3종이 실린다', async () => {
      setCookies(expiredToken());
      mockTokenEndpointOnce('b-access', 'b-refresh', 'b-id-token');
      vi.mocked(fetch).mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(502);
      expect(response.cookies.get('mm_id_token')?.value, '업스트림 연결 실패(502) 응답에도 회전된 id_token이 실려야 함').toBe(
        'b-id-token',
      );
    });

    it('V8-a — reactive 재시도 연결 실패(502)에도 회전 쿠키 3종이 실린다', async () => {
      setCookies(futureToken());
      // 1차 요청 401
      vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve(new Response('{}', { status: 401 })));
      mockTokenEndpointOnce('c-access', 'c-refresh', 'c-id-token');
      // 재시도 fetch throw
      vi.mocked(fetch).mockImplementationOnce(() => Promise.reject(new Error('ECONNRESET')));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(502);
      expect(response.cookies.get('mm_id_token')?.value, '재시도 연결 실패(502) 응답에도 회전된 id_token이 실려야 함').toBe(
        'c-id-token',
      );
    });

    it('V8-c — unauthorizedResponse(401)는 mm_id_token을 포함해 4종을 모두 삭제한다', async () => {
      // PRIVATE 미인증(access token 부재) → 상류 호출 없이 즉시 unauthorizedResponse
      mockCookieStore.get.mockReturnValue(undefined);

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/proxy/api/events');
      const response = await GET(request, { params: Promise.resolve({ path: ['api', 'events'] }) });

      expect(response.status).toBe(401);
      const setCookieHeader = response.headers.get('set-cookie') ?? '';
      for (const name of ['mm_auth', 'mm_id_token', 'mm_access_token', 'mm_refresh_token']) {
        expect(setCookieHeader, `${name}이 삭제 Set-Cookie에 포함돼야 함`).toContain(`${name}=`);
      }
      // maxAge=0(만료) 확인 — mm_id_token 쿠키 객체 자체로도 재확인(문자열 포함만으로는 값 오배치를 못 잡음)
      expect(response.cookies.get('mm_id_token')?.value).toBe('');
    });
  });
});
