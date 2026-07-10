import { describe, expect, it } from 'vitest';
import { deriveZoneLabel } from './parking-zone-label';

describe('deriveZoneLabel', () => {
  it('마지막 세그먼트(자리 번호)를 제거하고 나머지를 · 로 다시 결합한다', () => {
    expect(deriveZoneLabel('지하 2층·A구역·3')).toBe('지하 2층·A구역');
  });

  it('세그먼트가 2개면 자리 번호만 제거한 구획명 1단계를 반환한다', () => {
    expect(deriveZoneLabel('야외·8')).toBe('야외');
  });

  it('구분자가 없으면 원문을 그대로 반환한다(fragility 완화 — 예외 없이 안전 수렴)', () => {
    expect(deriveZoneLabel('z1-08')).toBe('z1-08');
  });
});
