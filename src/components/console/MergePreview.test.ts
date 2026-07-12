import { describe, expect, it } from 'vitest';
import { summarizeImportPreview } from './MergePreview';

/**
 * 렌더 없이 카운트 요약 문구 조립 로직만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node
 * 환경만 제공). 실 서버 프리뷰 응답이 항목별 상세 없이 카운트만 주므로 카운트 요약이
 * 이 컴포넌트의 핵심 산출물이다.
 */
describe('MergePreview — summarizeImportPreview (카운트 요약 문구)', () => {
  it('신규·수정·제외 카운트를 모두 포함한 요약 문구를 만든다', () => {
    const result = summarizeImportPreview({
      newCount: 3,
      updatedCount: 2,
      excludedCount: 1,
      invalidRows: [],
    });
    expect(result).toBe('신규 3건 · 수정 2건 · 제외 1건');
  });

  it('전부 0건이어도 문구 형식을 그대로 유지한다', () => {
    const result = summarizeImportPreview({
      newCount: 0,
      updatedCount: 0,
      excludedCount: 0,
      invalidRows: [],
    });
    expect(result).toBe('신규 0건 · 수정 0건 · 제외 0건');
  });
});
