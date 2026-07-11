import { describe, expect, it } from 'vitest';
import { parkDoneStorageKey } from './visitor-storage';

describe('parkDoneStorageKey — 셀프 주차 완료 sessionStorage 키 단일 정의', () => {
  it('slotCode를 포함한 키 문자열을 만든다', () => {
    expect(parkDoneStorageKey('z1-01')).toBe('visitor:park-done:z1-01');
  });

  it('slotCode가 다르면 키도 달라진다(자리별 격리 — 다른 자리 등록 결과와 섞이지 않는다)', () => {
    expect(parkDoneStorageKey('z1-01')).not.toBe(parkDoneStorageKey('z1-02'));
  });
});
