import { describe, expect, it } from 'vitest';
import { toCreatePayload, toFormValues, toUpdatePayload } from './IdleContentManager';
import type { IdleContent } from '@/types/kiosk';

/**
 * 렌더 없이 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만 제공 —
 * BrandingForm.test.ts와 동일 전략). 핵심 검증 대상은 등록/수정 payload 분기 — 서버 PUT
 * 계약(mode·play·sortOrder만)을 미러하는 update payload가 name·kind를 절대 포함하지 않는지다.
 */
function makeContent(overrides: Partial<IdleContent> = {}): IdleContent {
  return {
    id: 'idle-1',
    name: '입장 안내',
    kind: '이미지',
    mode: null,
    play: null,
    fileUrl: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe('IdleContentManager — toFormValues (콘텐츠 응답 → 폼 값 변환)', () => {
  it('content가 없으면(등록) 빈 값 + 기본 종류로 초기화된다', () => {
    expect(toFormValues(undefined)).toEqual({
      name: '',
      kind: '이미지',
      mode: '',
      play: '',
      sortOrder: 0,
    });
  });

  it('content가 있으면(수정) 응답값을 그대로 옮기고 null은 빈 문자열로 변환된다', () => {
    const content = makeContent({ name: '환영 영상', kind: '영상', mode: 'branded', play: '자동재생', sortOrder: 2 });
    expect(toFormValues(content)).toEqual({
      name: '환영 영상',
      kind: '영상',
      mode: 'branded',
      play: '자동재생',
      sortOrder: 2,
    });
  });
});

describe('IdleContentManager — toCreatePayload (등록 payload)', () => {
  it('name·kind를 포함하고 빈 문자열은 null로 변환한다', () => {
    const payload = toCreatePayload({ name: '입장 안내', kind: '이미지', mode: '', play: '', sortOrder: 1 });
    expect(payload).toEqual({
      name: '입장 안내',
      kind: '이미지',
      mode: null,
      play: null,
      sortOrder: 1,
    });
  });

  it('mode·play가 채워지면 그대로 전송한다', () => {
    const payload = toCreatePayload({
      name: '환영 영상',
      kind: '영상',
      mode: 'fullbleed',
      play: '자동재생',
      sortOrder: 3,
    });
    expect(payload).toMatchObject({ mode: 'fullbleed', play: '자동재생' });
  });
});

describe('IdleContentManager — toUpdatePayload (수정 payload — name·kind 제외 확인)', () => {
  it('mode·play·sortOrder만 포함하고 name·kind는 결과 객체에 아예 없다', () => {
    const payload = toUpdatePayload({ name: '환영 영상', kind: '영상', mode: 'branded', play: '자동재생', sortOrder: 5 });
    expect(payload).toEqual({ mode: 'branded', play: '자동재생', sortOrder: 5 });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('kind');
  });

  it('빈 문자열 mode·play는 null로 변환된다', () => {
    const payload = toUpdatePayload({ name: '입장 안내', kind: '이미지', mode: '', play: '', sortOrder: 0 });
    expect(payload).toEqual({ mode: null, play: null, sortOrder: 0 });
  });
});
