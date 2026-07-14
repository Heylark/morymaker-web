import { describe, expect, it } from 'vitest';
import { toFormValues } from './SeatGroupForm';
import type { SeatGroupResponse } from '@/types/seat';

/**
 * 렌더 없이 폼 값 변환 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만
 * 제공 — GuestEditModal.test.ts와 동일 전략). `toFormValues`는 `useForm`의 `values` 옵션에
 * 매 렌더 전달되어 편집 대상(group) 변경 시 폼을 동기화하는 핵심 로직 — 기존 그룹을 넘기면
 * 현재 라벨·번호지정 값이, 넘기지 않으면(그룹 추가) 빈 값이 나와야 편집/생성 두 모드가
 * 올바르게 갈린다.
 */
function makeGroup(overrides: Partial<SeatGroupResponse> = {}): SeatGroupResponse {
  return {
    id: 'group-1',
    groupNo: 1,
    label: 'VIP A열',
    numbering: true,
    sortOrder: 1,
    assignedCount: 3,
    slotCount: 10,
    ...overrides,
  };
}

describe('SeatGroupForm — toFormValues (편집 대상 → 폼 값 변환)', () => {
  it('group이 없으면(그룹 추가) label은 빈 문자열, numbering은 false를 반환한다', () => {
    expect(toFormValues(undefined)).toEqual({ label: '', numbering: false });
  });

  it('기존 그룹을 넘기면 현재 값으로 채워진다(편집 오픈 시 빈 폼 방지)', () => {
    const group = makeGroup();
    expect(toFormValues(group)).toEqual({ label: 'VIP A열', numbering: true });
  });

  it('numbering OFF 그룹(slotCount 키 자체가 없는 응답)도 정확히 false로 채워진다', () => {
    const group = makeGroup({ numbering: false, slotCount: undefined });
    expect(toFormValues(group)).toEqual({ label: 'VIP A열', numbering: false });
  });
});
