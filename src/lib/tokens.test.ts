import { describe, expect, it } from 'vitest';
import { extractEmail, extractEventIds, extractRoles, getJwtExp } from './tokens';

/** 서명 검증 없이 디코딩만 하므로, 테스트용 JWT는 헤더·서명을 아무 값으로 채워도 무방하다. */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-signature`;
}

describe('getJwtExp', () => {
  it('exp 클레임(Unix초)을 그대로 추출한다', () => {
    expect(getJwtExp(fakeJwt({ exp: 1783567721 }))).toBe(1783567721);
  });

  it('exp 부재 → 0(안전하게 "이미 만료"로 취급하도록 하는 신호값)', () => {
    expect(getJwtExp(fakeJwt({ sub: 'x' }))).toBe(0);
  });

  it('malformed 토큰(파트 3개 아님) → 0', () => {
    expect(getJwtExp('not-a-jwt')).toBe(0);
  });
});

describe('extractRoles', () => {
  it('roles 클레임을 그대로 반환한다(ROLE_ 접두사는 auth가 이미 제거해 발급)', () => {
    expect(extractRoles(fakeJwt({ roles: ['SYSTEM_ADMIN', 'EVENT_ADMIN'] }))).toEqual([
      'SYSTEM_ADMIN',
      'EVENT_ADMIN',
    ]);
  });

  it('roles 부재 → 빈 배열', () => {
    expect(extractRoles(fakeJwt({ sub: 'x' }))).toEqual([]);
  });

  it('roles가 배열이 아닌 손상된 형태 → 빈 배열(fail-safe)', () => {
    expect(extractRoles(fakeJwt({ roles: 'SYSTEM_ADMIN' }))).toEqual([]);
  });
});

describe('extractEmail', () => {
  it('email 클레임을 그대로 반환한다', () => {
    expect(extractEmail(fakeJwt({ email: 'admin@morymaker.local' }))).toBe('admin@morymaker.local');
  });

  it('email 부재(scope 미인가 등) → 빈 문자열', () => {
    expect(extractEmail(fakeJwt({ sub: 'x' }))).toBe('');
  });
});

describe('extractEventIds — 3-값 의미론(부재=SYSTEM_ADMIN / 빈배열=0건 / 목록)', () => {
  it('event_ids 클레임 자체가 없으면 null(SYSTEM_ADMIN, 전체 허용)을 반환한다', () => {
    expect(extractEventIds(fakeJwt({ roles: ['SYSTEM_ADMIN'] }))).toBeNull();
  });

  it('빈 배열이면 그대로 빈 배열(배정된 행사 0건)을 반환한다', () => {
    expect(extractEventIds(fakeJwt({ event_ids: [] }))).toEqual([]);
  });

  it('값이 있으면 배정된 행사 id 목록을 그대로 반환한다', () => {
    expect(extractEventIds(fakeJwt({ event_ids: ['evt-1', 'evt-2'] }))).toEqual(['evt-1', 'evt-2']);
  });

  it('malformed(배열이 아닌 값)는 부재(null)와 혼동하지 않고 빈 배열로 안전 수렴한다', () => {
    expect(extractEventIds(fakeJwt({ event_ids: 'not-an-array' }))).toEqual([]);
  });

  it('malformed 토큰(파트 3개 아님)도 null(SYSTEM_ADMIN 오분류)이 아니라 빈 배열로 수렴한다', () => {
    expect(extractEventIds('not-a-jwt')).toEqual([]);
  });
});
