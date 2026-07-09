import { describe, expect, it } from 'vitest';
import { getAuthMode } from './api-auth-mode';

describe('getAuthMode — 3분법 판정 (PUBLIC-prefix + fail-closed PRIVATE 디폴트)', () => {
  it('/api/events (GET) → private (fail-closed 디폴트 — PUBLIC prefix 밖)', () => {
    expect(getAuthMode('/api/events', 'GET')).toBe('private');
  });

  it('/api/public/x (GET) → public (permitAll matcher 미러)', () => {
    expect(getAuthMode('/api/public/x', 'GET')).toBe('public');
  });

  it('/api/public/x (POST, 비-GET) → private (쓰기는 항상 토큰 필수)', () => {
    expect(getAuthMode('/api/public/x', 'POST')).toBe('private');
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

  it('method 대소문자 무관', () => {
    expect(getAuthMode('/api/public/x', 'post')).toBe('private');
  });
});
