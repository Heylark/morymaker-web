import { describe, expect, it } from 'vitest';
import {
  addMember,
  deriveOffMemberIds,
  deriveOnRows,
  filterCandidateGuests,
  insertEmptyRow,
  moveRow,
  removeMember,
  removeRow,
  setRowGuest,
  toOffPayload,
  toOnPayload,
} from './SeatAssignModal';
import type { GuestResponse } from '@/types/guest';
import type { SeatSlotResponse } from '@/types/seat';

/**
 * 렌더 없이 배정 편집 순수 로직만 단위 테스트한다 — 이 프로젝트 vitest는 jsdom 없이 node
 * 환경만 제공하므로 DOM 없는 순수 로직만 테스트한다(기존 SeatGroupForm/SlotTitleTable 테스트와
 * 동일 전략). 핵심 위험 — ord는 배열 위치에서 파생되어야 하고, 저장 payload는 항상 그룹의
 * 전체 배정 집합이어야 한다(부분 전송 시 원자 교체가 나머지를 삭제).
 */
function makeSlot(overrides: Partial<SeatSlotResponse> = {}): SeatSlotResponse {
  return { id: 'slot-1', groupNo: 1, ord: 1, guestId: null, ...overrides };
}

function makeGuest(overrides: Partial<GuestResponse> = {}): GuestResponse {
  return {
    id: 'guest-1',
    name: '홍길동',
    org: null,
    title: null,
    phone: null,
    plate: null,
    seatGroupId: null,
    seatLabel: null,
    status: '대기',
    src: '사전',
    visitAt: null,
    token: 'tok-1',
    createdAt: '2026-07-13T00:00:00Z',
    ...overrides,
  };
}

describe('deriveOnRows — 서버 슬롯 → 편집 행 변환', () => {
  it('ord 순으로 정렬하고 rowId는 슬롯의 서버 id를 그대로 사용한다', () => {
    const slots = [
      makeSlot({ id: 'slot-b', ord: 2, guestId: 'g2', guestName: '박서준' }),
      makeSlot({ id: 'slot-a', ord: 1, guestId: 'g1', guestName: '김민준' }),
    ];

    const rows = deriveOnRows(slots);

    expect(rows).toEqual([
      { rowId: 'slot-a', guestId: 'g1', guestName: '김민준' },
      { rowId: 'slot-b', guestId: 'g2', guestName: '박서준' },
    ]);
  });

  it('빈 좌석(guestId null)도 그대로 행으로 변환된다', () => {
    const slots = [makeSlot({ id: 'slot-a', ord: 1, guestId: null, empty: true })];

    const rows = deriveOnRows(slots);

    expect(rows).toEqual([{ rowId: 'slot-a', guestId: null, guestName: null }]);
  });
});

describe('moveRow — 번호이동(↑/↓)', () => {
  const rows = [
    { rowId: 'a', guestId: null, guestName: null },
    { rowId: 'b', guestId: null, guestName: null },
    { rowId: 'c', guestId: null, guestName: null },
  ];

  it('up은 바로 위 행과 자리를 교환한다', () => {
    const result = moveRow(rows, 1, 'up');
    expect(result.map((r) => r.rowId)).toEqual(['b', 'a', 'c']);
  });

  it('down은 바로 아래 행과 자리를 교환한다', () => {
    const result = moveRow(rows, 1, 'down');
    expect(result.map((r) => r.rowId)).toEqual(['a', 'c', 'b']);
  });

  it('첫 행에서 up은 경계를 벗어나 원본을 그대로 반환한다(no-op)', () => {
    const result = moveRow(rows, 0, 'up');
    expect(result).toBe(rows);
  });

  it('마지막 행에서 down은 경계를 벗어나 원본을 그대로 반환한다(no-op)', () => {
    const result = moveRow(rows, 2, 'down');
    expect(result).toBe(rows);
  });
});

describe('insertEmptyRow / removeRow — 삽입·삭제', () => {
  const rows = [
    { rowId: 'a', guestId: 'g1', guestName: '김민준' },
    { rowId: 'b', guestId: 'g2', guestName: '박서준' },
  ];

  it('지정 위치에 빈 좌석을 삽입한다(주입된 newRowId 사용)', () => {
    const result = insertEmptyRow(rows, 1, 'new-1');
    expect(result.map((r) => r.rowId)).toEqual(['a', 'new-1', 'b']);
    expect(result[1]).toEqual({ rowId: 'new-1', guestId: null, guestName: null });
  });

  it('범위를 벗어난 인덱스는 끝에 삽입되도록 클램프된다', () => {
    const result = insertEmptyRow(rows, 99, 'new-2');
    expect(result.map((r) => r.rowId)).toEqual(['a', 'b', 'new-2']);
  });

  it('행 삭제는 나머지 행 순서를 유지한다', () => {
    const result = removeRow(rows, 0);
    expect(result.map((r) => r.rowId)).toEqual(['b']);
  });
});

describe('setRowGuest — 교체(게스트 선택/해제)', () => {
  it('지정 행의 guestId/guestName만 갱신하고 나머지는 그대로 둔다', () => {
    const rows = [
      { rowId: 'a', guestId: null, guestName: null },
      { rowId: 'b', guestId: 'g2', guestName: '박서준' },
    ];

    const result = setRowGuest(rows, 0, 'g1', '김민준');

    expect(result[0]).toEqual({ rowId: 'a', guestId: 'g1', guestName: '김민준' });
    expect(result[1]).toBe(rows[1]);
  });

  it('guestId를 null로 설정하면 좌석을 비운다(해제)', () => {
    const rows = [{ rowId: 'a', guestId: 'g1', guestName: '김민준' }];
    const result = setRowGuest(rows, 0, null, null);
    expect(result[0]).toEqual({ rowId: 'a', guestId: null, guestName: null });
  });
});

describe('toOnPayload — numbering ON 저장 payload (핵심 위험: ord 구조적 연속·유일)', () => {
  it('배열 위치에서 ord=index+1을 파생한다 — 사용자가 ord를 직접 입력하지 않으므로 항상 1..N 연속·유일', () => {
    const rows = [
      { rowId: 'a', guestId: 'g1', guestName: '김민준' },
      { rowId: 'b', guestId: null, guestName: null },
      { rowId: 'c', guestId: 'g3', guestName: '이서연' },
    ];

    const payload = toOnPayload(rows);

    expect(payload).toEqual([
      { ord: 1, guestId: 'g1' },
      { ord: 2, guestId: null },
      { ord: 3, guestId: 'g3' },
    ]);
  });

  it('빈 배열(좌석 0건)은 빈 payload를 반환한다', () => {
    expect(toOnPayload([])).toEqual([]);
  });
});

describe('deriveOffMemberIds / addMember / removeMember / toOffPayload — numbering OFF', () => {
  it('guestId가 있는 슬롯만 멤버로 추출한다(빈 좌석 개념 없음)', () => {
    const slots = [
      makeSlot({ id: 's1', guestId: 'g1' }),
      makeSlot({ id: 's2', guestId: null, empty: true }),
      makeSlot({ id: 's3', guestId: 'g3' }),
    ];
    expect(deriveOffMemberIds(slots)).toEqual(['g1', 'g3']);
  });

  it('addMember는 중복 추가를 막는다(구조적으로 payload 중복 400 방지)', () => {
    const result = addMember(['g1'], 'g1');
    expect(result).toEqual(['g1']);
  });

  it('addMember는 신규 게스트를 끝에 추가한다', () => {
    expect(addMember(['g1'], 'g2')).toEqual(['g1', 'g2']);
  });

  it('removeMember는 지정 게스트만 제거한다', () => {
    expect(removeMember(['g1', 'g2'], 'g1')).toEqual(['g2']);
  });

  it('toOffPayload는 ord를 플레이스홀더로 채우고 guestId를 그대로 담는다(서버가 ord 무시)', () => {
    expect(toOffPayload(['g1', 'g2'])).toEqual([
      { ord: 1, guestId: 'g1' },
      { ord: 2, guestId: 'g2' },
    ]);
  });
});

describe('filterCandidateGuests — 후보 명단 검색/제외 필터', () => {
  const guests = [
    makeGuest({ id: 'g1', name: '김민준', org: 'A사' }),
    makeGuest({ id: 'g2', name: '박서준', org: 'B사' }),
    makeGuest({ id: 'g3', name: '이서연', org: null }),
  ];

  it('이미 배정된 게스트(excludeIds)는 후보에서 제외한다', () => {
    const result = filterCandidateGuests(guests, ['g1'], '');
    expect(result.map((g) => g.id)).toEqual(['g2', 'g3']);
  });

  it('query가 비어 있으면(제외 후) 전체를 반환한다', () => {
    const result = filterCandidateGuests(guests, [], '');
    expect(result).toHaveLength(3);
  });

  it('이름으로 대소문자 무관 검색한다', () => {
    const result = filterCandidateGuests(guests, [], '민준');
    expect(result.map((g) => g.id)).toEqual(['g1']);
  });

  it('소속(org)으로도 검색한다', () => {
    const result = filterCandidateGuests(guests, [], 'B사');
    expect(result.map((g) => g.id)).toEqual(['g2']);
  });

  it('org가 null인 게스트도 예외 없이 필터링된다', () => {
    const result = filterCandidateGuests(guests, [], '이서연');
    expect(result.map((g) => g.id)).toEqual(['g3']);
  });
});
