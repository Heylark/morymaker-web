import { describe, expect, it } from 'vitest';
import { parseCheckinToken } from './qr-url';

describe('parseCheckinToken — 도메인 화이트리스트 + /u/{token} 패턴 검증', () => {
  it('운영 도메인 /u/{token} 패턴에서 토큰을 추출한다', () => {
    expect(parseCheckinToken('https://event.morymaker.co.kr/u/t1000')).toBe('t1000');
  });

  it('localhost 개발 환경도 허용한다', () => {
    expect(parseCheckinToken('http://localhost:3000/u/abc123')).toBe('abc123');
  });

  it('LAN IP(실기기 mkcert HTTPS) 접근도 허용한다', () => {
    expect(parseCheckinToken('https://192.168.50.128:3000/u/xyz')).toBe('xyz');
  });

  it('화이트리스트 밖 도메인은 무시(null)한다', () => {
    expect(parseCheckinToken('https://evil.example.com/u/t1000')).toBeNull();
  });

  it('경로 패턴이 /u/가 아니면 무시(null)한다 — 자리 QR(/p/) 오인식 방지', () => {
    expect(parseCheckinToken('https://event.morymaker.co.kr/p/z1-08')).toBeNull();
  });

  it('URL 형식이 아닌 문자열(예: 명함 QR)은 무시(null)한다', () => {
    expect(parseCheckinToken('BEGIN:VCARD\nFN:홍길동\nEND:VCARD')).toBeNull();
  });

  it('/u/ 하위에 세그먼트가 더 있으면(패턴 불일치) 무시한다', () => {
    expect(parseCheckinToken('https://event.morymaker.co.kr/u/t1000/extra')).toBeNull();
  });
});
