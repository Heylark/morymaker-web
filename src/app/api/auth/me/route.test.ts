import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeAuthCookie } from '@/lib/cookies';

const mockCookieStore: { get: (name: string) => { value: string } | undefined } = { get: () => undefined };

// Route Handler 실행은 Next.js가 요청마다 세팅하는 AsyncLocalStorage 컨텍스트에 의존한다 —
// 유닛 테스트에는 그 컨텍스트가 없어 next/headers를 직접 mock한다(BFF 프록시 route.test.ts와 동일 패턴).
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

/** 서명 검증이 아니라 클레임 디코딩만 대상이므로, 테스트용 access token은 헤더·서명을 아무 값으로 채워도 무방하다. */
function fakeAccessToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-signature`;
}

function stubCookies(values: Record<string, string>) {
  mockCookieStore.get = (name: string) => (values[name] !== undefined ? { value: values[name] } : undefined);
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    stubCookies({});
  });

  it('mm_auth 쿠키 없음 → user: null', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });

  it('mm_auth 위변조 → user: null (access token이 있어도 eventIds를 병기하지 않는다)', async () => {
    stubCookies({
      mm_auth: 'tampered.value',
      mm_access_token: fakeAccessToken({ event_ids: ['evt-1'] }),
    });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });

  it('event_ids 클레임 부재(SYSTEM_ADMIN) → eventIds: null', async () => {
    stubCookies({
      mm_auth: encodeAuthCookie({ username: 'admin@morymaker.local', roles: ['SYSTEM_ADMIN'] }),
      mm_access_token: fakeAccessToken({ roles: ['SYSTEM_ADMIN'] }),
    });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      user: { username: 'admin@morymaker.local', roles: ['SYSTEM_ADMIN'], eventIds: null },
    });
  });

  it('event_ids 빈 배열(배정 0건) → eventIds: []', async () => {
    stubCookies({
      mm_auth: encodeAuthCookie({ username: 'staff@morymaker.local', roles: ['EVENT_STAFF'] }),
      mm_access_token: fakeAccessToken({ roles: ['EVENT_STAFF'], event_ids: [] }),
    });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body.user.eventIds).toEqual([]);
  });

  it('event_ids 단일 배정 → eventIds: [단일 id]', async () => {
    stubCookies({
      mm_auth: encodeAuthCookie({ username: 'staff@morymaker.local', roles: ['EVENT_STAFF'] }),
      mm_access_token: fakeAccessToken({ roles: ['EVENT_STAFF'], event_ids: ['evt-1'] }),
    });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body.user.eventIds).toEqual(['evt-1']);
  });

  it('access token 쿠키 부재 → eventIds: [] (SYSTEM_ADMIN 오분류 방지, mm_auth만 유효해도 최소 정보는 응답)', async () => {
    stubCookies({
      mm_auth: encodeAuthCookie({ username: 'staff@morymaker.local', roles: ['EVENT_STAFF'] }),
    });
    const { GET } = await import('./route');
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      user: { username: 'staff@morymaker.local', roles: ['EVENT_STAFF'], eventIds: [] },
    });
  });
});
