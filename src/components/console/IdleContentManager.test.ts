import { describe, expect, it } from 'vitest';
import { deriveKind, isWithinSizeLimit, toCreatePayload, toFormValues, toUpdatePayload } from './IdleContentManager';
import type { IdleContent } from '@/types/kiosk';

/**
 * 렌더 없이 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만 제공 —
 * BrandingForm.test.ts와 동일 전략). 핵심 검증 대상은 (1) 등록/수정 payload 분기 — 서버 PUT
 * 계약(mode·play·sortOrder만)을 미러하는 update payload가 name·kind를 절대 포함하지 않는지,
 * (2) 파일 MIME→kind 자동 파생과 kind별 크기 사전검증이 allowlist·상한을 정확히 반영하는지다.
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
  it('content가 없으면(등록) 빈 값으로 초기화된다', () => {
    expect(toFormValues(undefined)).toEqual({
      name: '',
      mode: '',
      play: '',
      sortOrder: 0,
    });
  });

  it('content가 있으면(수정) 응답값을 그대로 옮기고 null은 빈 문자열로 변환된다', () => {
    const content = makeContent({ name: '환영 영상', kind: '영상', mode: 'branded', play: '자동재생', sortOrder: 2 });
    expect(toFormValues(content)).toEqual({
      name: '환영 영상',
      mode: 'branded',
      play: '자동재생',
      sortOrder: 2,
    });
  });
});

describe('IdleContentManager — toCreatePayload (등록 payload — kind는 파생값 파라미터로 받는다)', () => {
  it('name·derivedKind를 포함하고 빈 문자열 mode·play는 null로 변환한다', () => {
    const payload = toCreatePayload({ name: '입장 안내', mode: '', play: '', sortOrder: 1 }, '이미지');
    expect(payload).toEqual({
      name: '입장 안내',
      kind: '이미지',
      mode: null,
      play: null,
      sortOrder: 1,
    });
  });

  it('mode·play가 채워지면 그대로 전송한다', () => {
    const payload = toCreatePayload({ name: '환영 영상', mode: 'fullbleed', play: '자동재생', sortOrder: 3 }, '영상');
    expect(payload).toMatchObject({ kind: '영상', mode: 'fullbleed', play: '자동재생' });
  });
});

describe('IdleContentManager — toUpdatePayload (수정 payload — name·kind 제외 확인)', () => {
  it('mode·play·sortOrder만 포함하고 name·kind는 결과 객체에 아예 없다', () => {
    const payload = toUpdatePayload({ name: '환영 영상', mode: 'branded', play: '자동재생', sortOrder: 5 });
    expect(payload).toEqual({ mode: 'branded', play: '자동재생', sortOrder: 5 });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('kind');
  });

  it('빈 문자열 mode·play는 null로 변환된다', () => {
    const payload = toUpdatePayload({ name: '입장 안내', mode: '', play: '', sortOrder: 0 });
    expect(payload).toEqual({ mode: null, play: null, sortOrder: 0 });
  });
});

describe('IdleContentManager — deriveKind (파일 MIME → kind 자동 파생, R4)', () => {
  it('이미지 allowlist MIME이면 이미지로 파생된다', () => {
    expect(deriveKind('image/png')).toBe('이미지');
    expect(deriveKind('image/jpeg')).toBe('이미지');
    expect(deriveKind('image/webp')).toBe('이미지');
  });

  it('영상 allowlist MIME이면 영상으로 파생된다', () => {
    expect(deriveKind('video/mp4')).toBe('영상');
    expect(deriveKind('video/webm')).toBe('영상');
  });

  it('allowlist 밖 MIME은 null을 반환한다(사전검증 실패 — submit 시점 kind는 항상 파생 가능해야 함)', () => {
    expect(deriveKind('application/pdf')).toBeNull();
    expect(deriveKind('image/gif')).toBeNull();
  });
});

describe('IdleContentManager — isWithinSizeLimit (kind별 크기 사전검증, R3)', () => {
  it('이미지는 20MB 이하만 통과한다', () => {
    expect(isWithinSizeLimit('이미지', 20 * 1024 * 1024)).toBe(true);
    expect(isWithinSizeLimit('이미지', 20 * 1024 * 1024 + 1)).toBe(false);
  });

  it('영상은 200MB 이하만 통과한다', () => {
    expect(isWithinSizeLimit('영상', 200 * 1024 * 1024)).toBe(true);
    expect(isWithinSizeLimit('영상', 200 * 1024 * 1024 + 1)).toBe(false);
  });
});
