import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeAuthCookie } from '@/lib/cookies';
import { FORBIDDEN_PATH } from '@/lib/roles';

const mockCookieStore: { get: (name: string) => { value: string } | undefined } = { get: () => undefined };

// Server Component 실행은 Next.js가 요청마다 세팅하는 AsyncLocalStorage 컨텍스트에 의존한다 —
// 유닛 테스트에는 그 컨텍스트가 없어 next/headers를 직접 mock한다(다른 route.test.ts와 동일 패턴).
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

// redirect()는 실제 런타임에서 렌더를 중단시키려고 throw한다 — mock도 동일하게 throw해야
// assertRoleOrRedirect의 실제 제어 흐름(narrow된 payload에만 접근)과 같은 경로가 실행된다.
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

function stubCookies(values: Record<string, string>) {
  mockCookieStore.get = (name: string) => (values[name] !== undefined ? { value: values[name] } : undefined);
}

describe('assertRoleOrRedirect — 미인증/인증+불충족 분기 (게이트 무한 리다이렉트 루프 수정)', () => {
  beforeEach(() => {
    stubCookies({});
    mockRedirect.mockClear();
  });

  it('mm_auth 쿠키 없음(미인증) → /oauth/login?returnTo=...로 리다이렉트', async () => {
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(assertRoleOrRedirect(['SYSTEM_ADMIN'], '/accounts')).rejects.toThrow(
      'REDIRECT:/oauth/login?returnTo=/accounts',
    );
  });

  it('mm_auth 위변조(서명 불일치) → 미인증과 동일하게 로그인으로(untrusted → payload null)', async () => {
    stubCookies({ mm_auth: 'tampered.value' });
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(assertRoleOrRedirect(['SYSTEM_ADMIN'], '/accounts')).rejects.toThrow(
      'REDIRECT:/oauth/login?returnTo=/accounts',
    );
  });

  it('인증됐으나 role 불충족(EVENT_ADMIN이 SYSTEM_ADMIN 게이트 접근) → FORBIDDEN_PATH로 리다이렉트(로그인 아님 — 재발 방지 핵심 단언)', async () => {
    stubCookies({ mm_auth: encodeAuthCookie({ username: 'event-admin@morymaker.local', roles: ['EVENT_ADMIN'] }) });
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(assertRoleOrRedirect(['SYSTEM_ADMIN'], '/accounts')).rejects.toThrow(`REDIRECT:${FORBIDDEN_PATH}`);
  });

  it('인증+role 충족 → 리다이렉트 없이 정상 반환(렌더 계속)', async () => {
    stubCookies({ mm_auth: encodeAuthCookie({ username: 'admin@morymaker.local', roles: ['SYSTEM_ADMIN'] }) });
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(assertRoleOrRedirect(['SYSTEM_ADMIN'], '/accounts')).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('(console) 게이트 회귀 확인 — EVENT_STAFF가 ADMIN_ROLES 게이트 접근 시에도 FORBIDDEN_PATH(로그인 루프 아님)', async () => {
    stubCookies({ mm_auth: encodeAuthCookie({ username: 'staff@morymaker.local', roles: ['EVENT_STAFF'] }) });
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(assertRoleOrRedirect(['SYSTEM_ADMIN', 'EVENT_ADMIN'], '/events')).rejects.toThrow(
      `REDIRECT:${FORBIDDEN_PATH}`,
    );
  });

  it('(staff) 게이트 회귀 확인 — 3역할 전부 허용이라 EVENT_STAFF도 통과(리다이렉트 없음)', async () => {
    stubCookies({ mm_auth: encodeAuthCookie({ username: 'staff@morymaker.local', roles: ['EVENT_STAFF'] }) });
    const { assertRoleOrRedirect } = await import('./auth-gate');
    await expect(
      assertRoleOrRedirect(['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF'], '/staff'),
    ).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
