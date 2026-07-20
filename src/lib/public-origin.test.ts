import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicOrigin, isPublicSecure } from './public-origin';

/**
 * vitest.config.ts 전역 env가 AUTH_REDIRECT_URI=http://localhost:3000/oauth/callback(로컬 dev
 * 기본값)를 심어두므로, 별도 stub이 없는 케이스는 이 값이 기준선이다. getPublicOrigin/
 * isPublicSecure는 호출 시점에 process.env를 읽으므로(모듈 로드 시점 캐시 없음) vi.stubEnv만으로
 * 충분하고, cookies.ts의 SECURE 상수처럼 vi.resetModules가 필요하지 않다.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getPublicOrigin — 우선순위 폴백(APP_PUBLIC_ORIGIN > AUTH_REDIRECT_URI > fallbackUrl)', () => {
  it('AUTH_REDIRECT_URI만 있으면 그 origin을 반환한다(path는 폐기)', () => {
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(getPublicOrigin()).toBe('https://mm.i-commtech.co.kr');
  });

  it('APP_PUBLIC_ORIGIN이 설정되면 AUTH_REDIRECT_URI보다 우선한다', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', 'https://override.example.com');
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(getPublicOrigin()).toBe('https://override.example.com');
  });

  it('APP_PUBLIC_ORIGIN이 경로를 포함해도 origin만 취한다', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', 'https://override.example.com/some/path');
    expect(getPublicOrigin()).toBe('https://override.example.com');
  });

  it('malformed APP_PUBLIC_ORIGIN은 무시하고 AUTH_REDIRECT_URI로 폴백한다', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', 'not-a-valid-url');
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(getPublicOrigin()).toBe('https://mm.i-commtech.co.kr');
  });

  it('두 env가 모두 없으면 fallbackUrl(request.url)의 origin을 사용한다 — 로컬 dev 최종 안전망', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', '');
    vi.stubEnv('AUTH_REDIRECT_URI', '');
    expect(getPublicOrigin('http://localhost:4000/app/oauth/callback')).toBe('http://localhost:4000');
  });

  it('세 후보가 전부 없으면 하드코딩 안전망(localhost:3000)을 반환한다', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', '');
    vi.stubEnv('AUTH_REDIRECT_URI', '');
    expect(getPublicOrigin()).toBe('http://localhost:3000');
  });

  it('request.url이 컨테이너 bind 주소(0.0.0.0)여도 AUTH_REDIRECT_URI가 있으면 그 값이 우선한다 — 리버스 프록시 핵심 시나리오', () => {
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(getPublicOrigin('http://0.0.0.0:50000/app/oauth/callback?code=abc')).toBe(
      'https://mm.i-commtech.co.kr',
    );
  });
});

describe('isPublicSecure — 공개 origin scheme이 https인지', () => {
  it('공개 origin이 https면 true', () => {
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(isPublicSecure()).toBe(true);
  });

  it('공개 origin이 http(로컬 dev)면 false', () => {
    vi.stubEnv('AUTH_REDIRECT_URI', 'http://localhost:3000/app/oauth/callback');
    expect(isPublicSecure()).toBe(false);
  });

  it('APP_PUBLIC_ORIGIN 오버라이드가 http면 AUTH_REDIRECT_URI가 https여도 false(오버라이드 우선)', () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', 'http://staging.example.com');
    vi.stubEnv('AUTH_REDIRECT_URI', 'https://mm.i-commtech.co.kr/app/oauth/callback');
    expect(isPublicSecure()).toBe(false);
  });
});
