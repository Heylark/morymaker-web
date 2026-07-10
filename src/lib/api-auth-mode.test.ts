import { describe, expect, it } from 'vitest';
import { getAuthMode } from './api-auth-mode';

describe('getAuthMode — 3분법 판정 (PUBLIC-prefix 메서드 무관 + fail-closed PRIVATE 디폴트)', () => {
  it('/api/events (GET) → private (fail-closed 디폴트 — PUBLIC prefix 밖)', () => {
    expect(getAuthMode('/api/events', 'GET')).toBe('private');
  });

  it('/api/public/x (GET) → public (permitAll matcher 미러)', () => {
    expect(getAuthMode('/api/public/x', 'GET')).toBe('public');
  });

  it('/api/public/x (POST) → public (공개 prefix는 메서드 무관 — 공개 쓰기도 통과)', () => {
    expect(getAuthMode('/api/public/x', 'POST')).toBe('public');
  });

  it('/actuator/health (GET) → public', () => {
    expect(getAuthMode('/actuator/health', 'GET')).toBe('public');
  });

  it('leading slash 없어도 동일 판정', () => {
    expect(getAuthMode('api/public/x', 'GET')).toBe('public');
  });

  it('쿼리스트링이 있어도 판정에 영향 없음', () => {
    expect(getAuthMode('/api/events?page=0', 'GET')).toBe('private');
  });

  it('method 대소문자 무관 — PUBLIC prefix는 소문자 메서드도 public', () => {
    expect(getAuthMode('/api/public/x', 'post')).toBe('public');
  });

  // ── 회귀 가드 — 비공개 쓰기는 여전히 PRIVATE(변경 경계 봉인) ──────────────────
  it('/api/events (POST) → private (PUBLIC prefix 밖 쓰기는 여전히 토큰 필수)', () => {
    expect(getAuthMode('/api/events', 'POST')).toBe('private');
  });

  it('/api/events (PUT) → private (비공개 쓰기, 메서드 무관 여전히 PRIVATE)', () => {
    expect(getAuthMode('/api/events', 'PUT')).toBe('private');
  });

  it('/api/public/x (PUT) → public (PUBLIC prefix는 메서드 무관 확인 — POST 외 메서드도 동일)', () => {
    expect(getAuthMode('/api/public/x', 'PUT')).toBe('public');
  });

  it('/api/public/x (DELETE) → public (PUBLIC prefix는 메서드 무관 확인)', () => {
    expect(getAuthMode('/api/public/x', 'DELETE')).toBe('public');
  });
});
