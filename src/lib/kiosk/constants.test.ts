import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearKioskSession, kioskKeys } from './constants';

describe('kiosk/constants — 쿼리키·세션 초기화 순수 로직', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('kioskKeys는 전부 kiosk 접두를 공유한다(RESET 시 removeQueries 일괄 타깃)', () => {
    expect(kioskKeys.all).toEqual(['kiosk']);
    expect(kioskKeys.attendees('evt1', '김민준')[0]).toBe('kiosk');
    expect(kioskKeys.parking('evt1', '1234')[0]).toBe('kiosk');
    expect(kioskKeys.idle('evt1')[0]).toBe('kiosk');
  });

  it('clearKioskSession — SSR·node 테스트 환경(window 없음)에서는 예외 없이 no-op한다', () => {
    expect(() => clearKioskSession()).not.toThrow();
  });

  it('clearKioskSession — 브라우저 환경에서 세션 저장소 전체를 지운다(이전 방문자 데이터 잔류 방지)', () => {
    const clearSpy = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', { clear: clearSpy });

    clearKioskSession();

    expect(clearSpy).toHaveBeenCalledOnce();
  });
});
