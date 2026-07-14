import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES, FORBIDDEN_PATH, hasAnyRole, resolveGateOutcome, STAFF_ROLES, SYSTEM_ADMIN_ROLES } from './roles';

describe('hasAnyRole — STAFF_ROLES 포함/미포함 역할 판정', () => {
  it('EVENT_STAFF만 가진 사용자는 STAFF_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['EVENT_STAFF'], STAFF_ROLES)).toBe(true);
  });

  it('SYSTEM_ADMIN·EVENT_ADMIN도 STAFF_ROLES 게이트를 통과한다(상위 role 겸용)', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], STAFF_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], STAFF_ROLES)).toBe(true);
  });

  it('STAFF_ROLES에 없는 역할만 가진 사용자는 차단된다', () => {
    expect(hasAnyRole(['GUEST'], STAFF_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], STAFF_ROLES)).toBe(false);
  });

  it('여러 역할 중 하나만 겹쳐도 통과한다', () => {
    expect(hasAnyRole(['GUEST', 'EVENT_STAFF'], STAFF_ROLES)).toBe(true);
  });
});

describe('hasAnyRole — ADMIN_ROLES 포함/미포함 역할 판정 (콘솔 게이트 SSOT)', () => {
  it('SYSTEM_ADMIN·EVENT_ADMIN은 ADMIN_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], ADMIN_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], ADMIN_ROLES)).toBe(true);
  });

  it('EVENT_STAFF만 가진 사용자는 ADMIN_ROLES 게이트를 통과하지 못한다(실행자와 관리자 분리)', () => {
    expect(hasAnyRole(['EVENT_STAFF'], ADMIN_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], ADMIN_ROLES)).toBe(false);
  });
});

describe('hasAnyRole — SYSTEM_ADMIN_ROLES 포함/미포함 역할 판정 (계정 관리 게이트 SSOT)', () => {
  it('SYSTEM_ADMIN은 SYSTEM_ADMIN_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe(true);
  });

  it('EVENT_ADMIN은 ADMIN_ROLES는 통과해도 SYSTEM_ADMIN_ROLES는 통과하지 못한다(과허용 방지가 목적)', () => {
    expect(hasAnyRole(['EVENT_ADMIN'], ADMIN_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe(false);
  });

  it('EVENT_STAFF는 SYSTEM_ADMIN_ROLES 게이트를 통과하지 못한다', () => {
    expect(hasAnyRole(['EVENT_STAFF'], SYSTEM_ADMIN_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], SYSTEM_ADMIN_ROLES)).toBe(false);
  });
});

describe('resolveGateOutcome — 미인증/인증+불충족/통과 3갈래 판정 (게이트 무한 리다이렉트 루프 수정)', () => {
  it('userRoles가 null이면 미인증(UNAUTHENTICATED) — 로그인이 올바른 목적지', () => {
    expect(resolveGateOutcome(null, SYSTEM_ADMIN_ROLES)).toBe('UNAUTHENTICATED');
  });

  it('인증됐고 role이 충족되면 AUTHORIZED', () => {
    expect(resolveGateOutcome(['SYSTEM_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe('AUTHORIZED');
  });

  it('인증됐으나 role이 불충족이면 FORBIDDEN — 로그인이 아니라 종결 페이지로(재인증해도 role은 그대로라 로그인은 무한 루프를 유발한다)', () => {
    expect(resolveGateOutcome(['EVENT_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe('FORBIDDEN');
  });

  it('인증됐으나 role 배열이 빈 배열이면 FORBIDDEN(미인증과 다른 사유)', () => {
    expect(resolveGateOutcome([], ADMIN_ROLES)).toBe('FORBIDDEN');
  });

  it('FORBIDDEN_PATH는 게이트 그룹((console)/(staff)/(kiosk)/(visitor)) 라우트 세그먼트를 포함하지 않는다 — 게이트 걸린 경로를 폴백으로 쓰면 새 무한 루프가 생긴다', () => {
    expect(FORBIDDEN_PATH).toBe('/forbidden');
    expect(FORBIDDEN_PATH).not.toMatch(/^\/(console|staff|kiosk|visitor|events|accounts)(\/|$)/);
  });
});
