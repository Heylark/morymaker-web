import { describe, expect, it } from 'vitest';
import { toEditFormValues } from './AccountEditModal';
import type { AccountResponse } from '@/types/account';

/**
 * 렌더 없이 폼 값 변환 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만
 * 제공). `toEditFormValues`는 `useForm`의 `values` 옵션에 매 렌더 전달되어 편집 대상(account)
 * 변경 시 폼을 동기화하는 핵심 로직 — GuestEditModal의 toFormValues와 동일 위험(빈 폼으로
 * 열리는 버그)을 방지한다.
 */
function makeAccount(overrides: Partial<AccountResponse> = {}): AccountResponse {
  return {
    id: 'acc-1',
    email: 'staff@example.com',
    name: '홍길동',
    role: 'EVENT_STAFF',
    status: '활성',
    eventIds: ['evt-1'],
    note: '주차 담당',
    ...overrides,
  };
}

describe('AccountEditModal — toEditFormValues (편집 대상 → 폼 값 변환)', () => {
  it('account가 없으면 SYSTEM_ADMIN이 아닌 기본 역할(EVENT_STAFF)과 빈 값으로 채워진다', () => {
    expect(toEditFormValues(undefined)).toEqual({
      name: '',
      role: 'EVENT_STAFF',
      eventIds: [],
      note: '',
    });
  });

  it('기존 계정을 넘기면 현재 값으로 채워진다(편집 오픈 시 빈 폼 방지)', () => {
    const account = makeAccount();
    expect(toEditFormValues(account)).toEqual({
      name: '홍길동',
      role: 'EVENT_STAFF',
      eventIds: ['evt-1'],
      note: '주차 담당',
    });
  });

  it('null 필드(name·note)는 빈 문자열로 폴백한다', () => {
    const account = makeAccount({ name: null, note: null });
    expect(toEditFormValues(account)).toEqual({
      name: '',
      role: 'EVENT_STAFF',
      eventIds: ['evt-1'],
      note: '',
    });
  });

  it('SYSTEM_ADMIN 계정은 eventIds가 빈 배열이어도 그대로 반영한다(서버가 이미 무시한 상태)', () => {
    const account = makeAccount({ role: 'SYSTEM_ADMIN', eventIds: [] });
    expect(toEditFormValues(account)).toEqual({
      name: '홍길동',
      role: 'SYSTEM_ADMIN',
      eventIds: [],
      note: '주차 담당',
    });
  });
});
