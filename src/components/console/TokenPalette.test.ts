import { describe, expect, it } from 'vitest';
import { insertTokenAtCursor } from './TokenPalette';

/**
 * 렌더 없이 커서 위치 삽입 로직만 단위 테스트한다(vitest.config.ts가 node 환경만 제공 —
 * PATTERN-020, 실제 textarea DOM 포커스/커서 이동은 이 순수 함수 밖의 관심사).
 */
describe('TokenPalette — insertTokenAtCursor (커서 위치 토큰 삽입)', () => {
  it('커서 위치에 토큰을 삽입하고 다음 커서를 토큰 뒤로 반환한다', () => {
    const result = insertTokenAtCursor('안녕하세요 ', '[$참석자]', 6);
    expect(result.text).toBe('안녕하세요 [$참석자]');
    expect(result.nextCursor).toBe(6 + '[$참석자]'.length);
  });

  it('빈 문자열에 삽입하면 토큰만 남는다', () => {
    const result = insertTokenAtCursor('', '[$행사명]', 0);
    expect(result.text).toBe('[$행사명]');
    expect(result.nextCursor).toBe('[$행사명]'.length);
  });

  it('커서 위치가 음수여도 0으로 clamp된다', () => {
    const result = insertTokenAtCursor('본문', '[$장소]', -5);
    expect(result.text).toBe('[$장소]본문');
  });

  it('커서 위치가 문자열 길이를 초과해도 끝으로 clamp된다', () => {
    const result = insertTokenAtCursor('본문', '[$일시]', 999);
    expect(result.text).toBe('본문[$일시]');
  });

  it('문자열 중간에 삽입하면 앞뒤 텍스트를 보존한다', () => {
    const result = insertTokenAtCursor('앞뒤', '[X]', 1);
    expect(result.text).toBe('앞[X]뒤');
    expect(result.nextCursor).toBe(1 + '[X]'.length);
  });
});
