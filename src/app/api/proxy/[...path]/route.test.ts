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
});
