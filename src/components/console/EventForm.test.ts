import { describe, expect, it } from 'vitest';
import { datetimeLocalToIso, isoToDatetimeLocal } from './EventForm';

/**
 * 렌더 없이 datetime-local ↔ ISO 변환 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이
 * node 환경만 제공 — 컴포넌트 렌더·E2E 테스트는 브라우저 인프라가 필요한데 이 프로젝트엔 아직 없다).
 * 두 시각 경계(폼 ↔ api)의 핵심 위험은 null/빈 값 처리와 왕복(round-trip) 안정성이다.
 */
describe('EventForm — isoToDatetimeLocal (ISO → datetime-local 표시값)', () => {
  it('ISO 문자열을 초 없는 YYYY-MM-DDTHH:mm 형태로 변환한다', () => {
    const result = isoToDatetimeLocal('2026-01-15T09:30:00.000Z');
    // 로컬 타임존에 따라 날짜/시각이 달라질 수 있으므로 형식만 검증한다.
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('null은 빈 문자열로 변환한다(미지정)', () => {
    expect(isoToDatetimeLocal(null)).toBe('');
  });

  it('파싱 불가능한 문자열은 빈 문자열로 변환한다', () => {
    expect(isoToDatetimeLocal('not-a-date')).toBe('');
  });
});

describe('EventForm — datetimeLocalToIso (datetime-local 입력값 → ISO)', () => {
  it('빈 문자열은 null로 변환한다(선택 필드 미지정)', () => {
    expect(datetimeLocalToIso('')).toBeNull();
  });

  it('파싱 불가능한 문자열은 null로 변환한다', () => {
    expect(datetimeLocalToIso('garbage')).toBeNull();
  });

  it('유효한 datetime-local 값은 ISO 문자열로 변환된다', () => {
    const result = datetimeLocalToIso('2026-01-15T18:00');
    expect(result).not.toBeNull();
    expect(() => new Date(result as string).toISOString()).not.toThrow();
  });
});

describe('EventForm — 왕복(round-trip) 안정성', () => {
  it('ISO → datetime-local → ISO 변환 후에도 같은 시각을 가리킨다(초 절단 오차 허용)', () => {
    const original = '2026-03-01T12:34:00.000Z';
    const local = isoToDatetimeLocal(original);
    const roundTripped = datetimeLocalToIso(local);

    expect(new Date(roundTripped as string).getTime()).toBe(new Date(original).getTime());
  });
});
