import { describe, expect, it } from 'vitest';
import { DEFAULT_RETURN_TO, safeReturnTo } from './return-to';

describe('safeReturnTo — 위반 입력은 전부 안전 디폴트로 폴백', () => {
  it('절대 URL(외부 오리진)은 폴백된다', () => {
    expect(safeReturnTo('https://evil.com')).toBe(DEFAULT_RETURN_TO);
  });

  it('프로토콜 상대 URL(//evil.com)은 폴백된다', () => {
    expect(safeReturnTo('//evil.com')).toBe(DEFAULT_RETURN_TO);
  });

  it('백슬래시로 시작하는 경로(/\\evil.com)는 폴백된다', () => {
    expect(safeReturnTo('/\\evil.com')).toBe(DEFAULT_RETURN_TO);
  });

  it('percent-encoded 슬래시(%2f%2fevil.com)는 폴백된다', () => {
    expect(safeReturnTo('%2f%2fevil.com')).toBe(DEFAULT_RETURN_TO);
  });

  it('percent-encoded 백슬래시(%5cevil.com)는 폴백된다', () => {
    expect(safeReturnTo('%5cevil.com')).toBe(DEFAULT_RETURN_TO);
  });

  it('빈 문자열은 폴백된다', () => {
    expect(safeReturnTo('')).toBe(DEFAULT_RETURN_TO);
  });

  it('null은 폴백된다', () => {
    expect(safeReturnTo(null)).toBe(DEFAULT_RETURN_TO);
  });

  it('undefined는 폴백된다', () => {
    expect(safeReturnTo(undefined)).toBe(DEFAULT_RETURN_TO);
  });

  it('스킴으로 해석될 수 있는 값(/javascript:alert(1))은 폴백된다', () => {
    expect(safeReturnTo('/javascript:alert(1)')).toBe(DEFAULT_RETURN_TO);
  });

  it('탭 문자로 //를 위장한 값(URL 파서가 탭을 제거해 재결합)은 오리진 재확인 단계에서 폴백된다', () => {
    // 문자열 검사(2~5단계)만으로는 "/\t/evil.com"이 "//"로 시작하지 않아 통과하지만,
    // WHATWG URL 파서가 파싱 전 ASCII 탭을 제거해 "//evil.com"으로 재결합되므로
    // 오리진 재확인(6단계)이 최종적으로 걸러낸다.
    expect(safeReturnTo('/\t/evil.com')).toBe(DEFAULT_RETURN_TO);
  });
});

describe('safeReturnTo — 동일 오리진 상대경로는 보존', () => {
  it('/console은 그대로 보존된다', () => {
    expect(safeReturnTo('/console')).toBe('/console');
  });

  it('/console/events는 그대로 보존된다', () => {
    expect(safeReturnTo('/console/events')).toBe('/console/events');
  });

  it('/는 그대로 보존된다', () => {
    expect(safeReturnTo('/')).toBe('/');
  });

  it('쿼리스트링이 있는 경로도 보존된다', () => {
    expect(safeReturnTo('/console?tab=events')).toBe('/console?tab=events');
  });

  it('세그먼트가 깊은 경로도 보존된다', () => {
    expect(safeReturnTo('/console/events/abc')).toBe('/console/events/abc');
  });
});
