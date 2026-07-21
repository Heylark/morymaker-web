import { describe, expect, it } from 'vitest';
import { resolveHeaderMeta, statusPillTone } from './console-routes';

describe('console-routes — resolveHeaderMeta (목록형)', () => {
  it('/events는 목록형 + "+ 새 행사" 액션을 반환한다', () => {
    expect(resolveHeaderMeta('/events', {})).toEqual({
      variant: 'list',
      title: '행사 목록',
      backHref: null,
      action: { label: '+ 새 행사', href: '/events/new' },
    });
  });

  it('/events/new는 목록형 + backHref만 있고 액션은 없다', () => {
    expect(resolveHeaderMeta('/events/new', {})).toEqual({
      variant: 'list',
      title: '새 행사',
      backHref: '/events',
      action: null,
    });
  });

  it('/accounts는 목록형 + "+ 계정 추가" 액션을 반환한다', () => {
    expect(resolveHeaderMeta('/accounts', {})).toEqual({
      variant: 'list',
      title: '계정 관리',
      backHref: null,
      action: { label: '+ 계정 추가', href: '/accounts/new' },
    });
  });

  it('/staff/scan·/staff/scan/confirm은 목록형이다(상세형 아님)', () => {
    expect(resolveHeaderMeta('/staff/scan', {})?.variant).toBe('list');
    expect(resolveHeaderMeta('/staff/scan/confirm', {})).toEqual({
      variant: 'list',
      title: '본인 확인',
      backHref: '/staff/scan',
      action: null,
    });
  });
});

describe('console-routes — resolveHeaderMeta (상세형, eid 필요)', () => {
  it('eid가 있으면 /events/{eid}/edit이 상세형으로 매칭된다', () => {
    expect(resolveHeaderMeta('/events/e1/edit', { eid: 'e1' })).toEqual({
      variant: 'detail',
      eyebrow: '행사 · 행사 정보',
      backHref: '/events',
    });
  });

  it('eid가 없으면(예: /events/new) eid 필요 행은 후보에서 제외되어 미매칭 상태를 유지한다', () => {
    // /events/new는 목록형 레지스트리에서 이미 매칭되므로 eid 오인 없이 정상 반환된다.
    expect(resolveHeaderMeta('/events/new', {})?.variant).toBe('list');
  });

  it('zid까지 있어야 parking/{zid} 행이 매칭된다(D5 정정)', () => {
    expect(resolveHeaderMeta('/events/e1/parking/z1', { eid: 'e1', zid: 'z1' })).toEqual({
      variant: 'detail',
      eyebrow: '행사 · 주차 · 구획',
      backHref: '/events/e1/parking',
    });
  });

  it('zid 없이는 parking(구획 목록)만 매칭되고 parking/{zid}는 매칭되지 않는다', () => {
    expect(resolveHeaderMeta('/events/e1/parking', { eid: 'e1' })).toEqual({
      variant: 'detail',
      eyebrow: '행사 · 주차',
      backHref: '/events',
    });
  });

  it('roster/template은 backHref가 roster로 향한다', () => {
    expect(resolveHeaderMeta('/events/e1/roster/template', { eid: 'e1' })).toEqual({
      variant: 'detail',
      eyebrow: '행사 · 명단 · 문자 템플릿',
      backHref: '/events/e1/roster',
    });
  });
});

describe('console-routes — resolveHeaderMeta (미등록 경로 — 안전 퇴화)', () => {
  it('레지스트리에 없는 경로는 null을 반환한다', () => {
    expect(resolveHeaderMeta('/staff/home', {})).toBeNull();
  });

  it('pathname이 null이면 null을 반환한다', () => {
    expect(resolveHeaderMeta(null, {})).toBeNull();
  });
});

/**
 * V19 — statusPillTone 클래스 단언 대상 순수 함수. 정본 대조(ADR-026): 운영중=pending(정본
 * `.pill`) / 준비·종료=void(정본 `.pill dim`). 'done'은 콘솔 셸 씬에 대응물이 없어 반환하지 않는다.
 */
describe('console-routes — statusPillTone (ADR-026 정본 대조)', () => {
  it('운영중은 pending이다', () => {
    expect(statusPillTone('운영중')).toBe('pending');
  });

  it('준비는 void다', () => {
    expect(statusPillTone('준비')).toBe('void');
  });

  it('종료는 void다', () => {
    expect(statusPillTone('종료')).toBe('void');
  });

  it('미지의 상태 문자열·빈 값은 void로 안전 퇴화한다(과대 강조 방지)', () => {
    expect(statusPillTone('알수없음')).toBe('void');
    expect(statusPillTone(null)).toBe('void');
    expect(statusPillTone(undefined)).toBe('void');
  });
});
