import { describe, expect, it, vi } from 'vitest';
import { parseCheckinToken } from './qr-url';

/**
 * vitest.config.ts의 전역 NEXT_PUBLIC_BASE_PATH='/app' 아래에서 실행된다 — 양성
 * 케이스는 실제 배포 좌표계(`/app/u/{token}`)로 이동됐다. 호스트 화이트리스트·경로 형태·
 * 음성 거부라는 기존 7케이스의 *의도*는 그대로 보존한다.
 */
describe('parseCheckinToken — 도메인 화이트리스트 + /u/{token} 패턴 검증', () => {
  it('운영 도메인 /app/u/{token} 패턴에서 토큰을 추출한다', () => {
    expect(parseCheckinToken('https://mm.i-commtech.co.kr/app/u/t1000')).toBe('t1000');
  });

  it('localhost 개발 환경도 허용한다', () => {
    expect(parseCheckinToken('http://localhost:3000/app/u/abc123')).toBe('abc123');
  });

  it('LAN IP(실기기 mkcert HTTPS) 접근도 허용한다', () => {
    expect(parseCheckinToken('https://192.168.50.128:3000/app/u/xyz')).toBe('xyz');
  });

  it('화이트리스트 밖 도메인은 무시(null)한다', () => {
    expect(parseCheckinToken('https://evil.example.com/app/u/t1000')).toBeNull();
  });

  it('경로 패턴이 /u/가 아니면 무시(null)한다 — 자리 QR(/p/) 오인식 방지', () => {
    expect(parseCheckinToken('https://mm.i-commtech.co.kr/p/z1-08')).toBeNull();
  });

  it('URL 형식이 아닌 문자열(예: 명함 QR)은 무시(null)한다', () => {
    expect(parseCheckinToken('BEGIN:VCARD\nFN:홍길동\nEND:VCARD')).toBeNull();
  });

  it('/u/ 하위에 세그먼트가 더 있으면(패턴 불일치) 무시한다', () => {
    expect(parseCheckinToken('https://mm.i-commtech.co.kr/app/u/t1000/extra')).toBeNull();
  });

  it('basePath 없는 배포 QR(구 좌표 /app/u/ 미포함)은 배포 좌표계에서 거부한다 — 이중 발급 방지', () => {
    expect(parseCheckinToken('https://mm.i-commtech.co.kr/u/t1000')).toBeNull();
  });

  it('BASE_PATH가 빈 문자열(로컬 개발)이면 /u/ 패턴을 그대로 허용한다 — 환경별 자동 정합 회귀 가드', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    const { parseCheckinToken: parseLocal } = await import('./qr-url');
    expect(parseLocal('http://localhost:3000/u/abc123')).toBe('abc123');
    // 로컬 좌표계에서도 /app 접두 값은 거부돼야 한다(패턴이 정확히 그 환경의 좌표계만 인정)
    expect(parseLocal('http://localhost:3000/app/u/abc123')).toBeNull();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
