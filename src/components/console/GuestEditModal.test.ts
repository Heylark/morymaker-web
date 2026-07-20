import { describe, expect, it } from 'vitest';
import { toFormValues } from './GuestEditModal';
import type { GuestResponse } from '@/types/guest';

/**
 * 렌더 없이 폼 값 변환 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만
 * 제공). `toFormValues`는 `useForm`의 `values` 옵션에 매 렌더 전달되어 편집 대상(guest) 변경 시
 * 폼을 동기화하는 핵심 로직 — 기존 게스트를 넘기면 현재 값이, 넘기지 않으면(개별 등록) 빈 값이
 * 나와야 편집/등록 두 모드가 올바르게 갈린다(되돌림 원인 — 빈 폼으로 열리는 버그의 근본 로직).
 */
function makeGuest(overrides: Partial<GuestResponse> = {}): GuestResponse {
  return {
    id: 'guest-1',
    name: '테스트게스트',
    org: '모리메이커',
    title: '팀장',
    phone: '01011112222',
    plate: null,
    seatGroupId: null,
    seatLabel: null,
    status: '대기',
    src: '현장',
    visitAt: null,
    token: 'tok-1',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('GuestEditModal — toFormValues (편집 대상 → 폼 값 변환)', () => {
  it('guest가 없으면(개별 등록) 전부 빈 문자열을 반환한다', () => {
    expect(toFormValues(undefined)).toEqual({
      name: '',
      org: '',
      title: '',
      phone: '',
      plate: '',
    });
  });

  it('기존 게스트를 넘기면 현재 값으로 채워진다(편집 오픈 시 빈 폼 방지)', () => {
    const guest = makeGuest();
    expect(toFormValues(guest)).toEqual({
      name: '테스트게스트',
      org: '모리메이커',
      title: '팀장',
      phone: '01011112222',
      plate: '',
    });
  });

  it('null 필드는 빈 문자열로 폴백한다(서버 null 허용 필드 — org/title/phone/plate)', () => {
    const guest = makeGuest({ org: null, title: null, phone: null, plate: null });
    expect(toFormValues(guest)).toEqual({
      name: '테스트게스트',
      org: '',
      title: '',
      phone: '',
      plate: '',
    });
  });
});
