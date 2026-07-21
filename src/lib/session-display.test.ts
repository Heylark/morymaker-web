import { describe, expect, it } from 'vitest';
import { displayNameOf, initialOf, roleLabelOf } from './session-display';

describe('session-display — displayNameOf (CP-1 Q2=A: 이메일 전체 표시)', () => {
  it('이메일을 그대로 반환한다(잘라내지 않음)', () => {
    expect(displayNameOf('dev-verify@morymaker.local')).toBe('dev-verify@morymaker.local');
  });

  it('빈 문자열·공백은 "로그인 계정"으로 폴백한다', () => {
    expect(displayNameOf('')).toBe('로그인 계정');
    expect(displayNameOf('   ')).toBe('로그인 계정');
  });

  it('null·undefined는 "로그인 계정"으로 폴백한다', () => {
    expect(displayNameOf(null)).toBe('로그인 계정');
    expect(displayNameOf(undefined)).toBe('로그인 계정');
  });
});

describe('session-display — initialOf (아바타 이니셜 — 로컬파트 첫 글자 대문자)', () => {
  it('로컬파트 첫 글자를 대문자로 반환한다', () => {
    expect(initialOf('dev-verify@morymaker.local')).toBe('D');
  });

  it('빈 값은 "·"로 폴백한다', () => {
    expect(initialOf('')).toBe('·');
    expect(initialOf(null)).toBe('·');
    expect(initialOf(undefined)).toBe('·');
  });
});

describe('session-display — roleLabelOf (최상위 1개, accountRoleLabel 재사용)', () => {
  it('SYSTEM_ADMIN이 있으면 우선순위 최상위로 반환한다', () => {
    expect(roleLabelOf(['EVENT_STAFF', 'SYSTEM_ADMIN'])).toBe('시스템 관리자');
  });

  it('EVENT_ADMIN만 있으면 행사 관리자를 반환한다', () => {
    expect(roleLabelOf(['EVENT_ADMIN'])).toBe('행사 관리자');
  });

  it('EVENT_STAFF만 있으면 행사 실행자를 반환한다', () => {
    expect(roleLabelOf(['EVENT_STAFF'])).toBe('행사 실행자');
  });

  it('빈 배열·null·undefined는 "권한 없음"이다', () => {
    expect(roleLabelOf([])).toBe('권한 없음');
    expect(roleLabelOf(null)).toBe('권한 없음');
    expect(roleLabelOf(undefined)).toBe('권한 없음');
  });
});
