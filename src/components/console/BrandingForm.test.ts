import { describe, expect, it } from 'vitest';
import { toFormValues } from './BrandingForm';
import type { EventResponse } from '@/types/console';

/**
 * 렌더 없이 폼 값 변환 순수 함수만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node 환경만
 * 제공 — SeatGroupForm.test.ts와 동일 전략). `toFormValues`는 편집 UI가 없는 `kv`·
 * `defaultIdleMode`까지 폼 state에 그대로 옮기는 클로버 방지 로직의 입력부라, 두 필드가
 * 누락 없이 옮겨지는지가 핵심 검증 대상이다(PUT branding이 full-replace 의미일 때 두 필드가
 * 조용히 지워지는 사고를 막는 라운드트립의 첫 단계).
 */
function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 'evt-1',
    name: '2026 신년회',
    eventDate: null,
    place: null,
    type: null,
    status: '준비',
    active: false,
    bgColor: null,
    pointColor: null,
    titleColor: null,
    bodyColor: null,
    kv: null,
    defaultIdleMode: null,
    smsPolicy: null,
    ...overrides,
  };
}

describe('BrandingForm — toFormValues (행사 응답 → 폼 값 변환)', () => {
  it('컬러 4종이 null이면(미지정) 폼 값도 null로 그대로 유지된다', () => {
    const event = makeEvent();
    expect(toFormValues(event)).toEqual({
      bgColor: null,
      pointColor: null,
      titleColor: null,
      bodyColor: null,
      kv: null,
      defaultIdleMode: null,
    });
  });

  it('저장된 컬러 4종을 폼 값으로 그대로 옮긴다', () => {
    const event = makeEvent({
      bgColor: '#08090c',
      pointColor: '#d4b36a',
      titleColor: '#f0dca8',
      bodyColor: '#ede9e0',
    });
    expect(toFormValues(event)).toMatchObject({
      bgColor: '#08090c',
      pointColor: '#d4b36a',
      titleColor: '#f0dca8',
      bodyColor: '#ede9e0',
    });
  });

  it('편집 UI가 없는 kv·defaultIdleMode도 현재값 그대로 폼 값에 포함된다(클로버 방지 라운드트립 준비)', () => {
    const event = makeEvent({ kv: '2026 신년회 키비주얼', defaultIdleMode: 'branded' });
    expect(toFormValues(event)).toMatchObject({
      kv: '2026 신년회 키비주얼',
      defaultIdleMode: 'branded',
    });
  });
});
