import { describe, expect, it } from 'vitest';
import { guestStatusTone, seatLabelDisplay, smsLogStatusTone } from './console-constants';

describe('console-constants — guestStatusTone (게스트 상태 → 배지 톤)', () => {
  it('대기는 pending 톤', () => {
    expect(guestStatusTone('대기')).toBe('pending');
  });
  it('방문·참석은 done 톤', () => {
    expect(guestStatusTone('방문')).toBe('done');
    expect(guestStatusTone('참석')).toBe('done');
  });
  it('취소는 void 톤(저강조)', () => {
    expect(guestStatusTone('취소')).toBe('void');
  });
});

describe('console-constants — smsLogStatusTone (발송 로그 상태 → 배지 톤)', () => {
  it('성공은 done 톤', () => {
    expect(smsLogStatusTone('성공')).toBe('done');
  });
  it('실패·반송은 void 톤', () => {
    expect(smsLogStatusTone('실패')).toBe('void');
    expect(smsLogStatusTone('반송')).toBe('void');
  });
});

describe('console-constants — seatLabelDisplay (좌석 표시값)', () => {
  it('null이면 안내 문구로 대체한다(엑셀 임포트로는 좌석이 채워지지 않음)', () => {
    expect(seatLabelDisplay(null)).toBe('미배정 (별도 배정)');
  });
  it('값이 있으면 그대로 반환한다', () => {
    expect(seatLabelDisplay('1층 A구역 3')).toBe('1층 A구역 3');
  });
});
