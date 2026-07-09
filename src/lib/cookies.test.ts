import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  decodeAuthCookieEdge,
  decodeAuthCookieNode,
  encodeAuthCookie,
} from './cookies';

const ORIGINAL_SECRET = process.env.AUTH_HMAC_SECRET;

beforeEach(() => {
  process.env.AUTH_HMAC_SECRET = 'test-secret-at-least-32-chars-long';
});

afterEach(() => {
  process.env.AUTH_HMAC_SECRET = ORIGINAL_SECRET;
});

describe('encodeAuthCookie / decodeAuthCookieNode', () => {
  it('round-trip PASS — 서명된 쿠키를 그대로 디코딩하면 원본 payload를 복원한다', () => {
    const payload = { username: 'admin@morymaker.local', roles: ['SYSTEM_ADMIN'] };
    const encoded = encodeAuthCookie(payload);
    const decoded = decodeAuthCookieNode(encoded);
    expect(decoded).toEqual(payload);
  });

  it('위변조 payload → decode null (base64 부분만 조작 시 서명 불일치)', () => {
    const encoded = encodeAuthCookie({ username: 'admin', roles: ['EVENT_ADMIN'] });
    const [, sig] = encoded.split('.');
    const tamperedB64 = Buffer.from(JSON.stringify({ username: 'attacker', roles: ['SYSTEM_ADMIN'] })).toString(
      'base64',
    );
    const tampered = `${tamperedB64}.${sig}`;
    expect(decodeAuthCookieNode(tampered)).toBeNull();
  });

  it('시크릿 상이 → decode null (서명 당시와 다른 시크릿으로 검증하면 실패)', () => {
    const encoded = encodeAuthCookie({ username: 'admin', roles: ['EVENT_STAFF'] });
    process.env.AUTH_HMAC_SECRET = 'a-completely-different-secret-value';
    expect(decodeAuthCookieNode(encoded)).toBeNull();
  });

  it('무점(legacy 무서명) 값 → decode null', () => {
    expect(decodeAuthCookieNode('not-a-signed-cookie-value')).toBeNull();
  });

  it('시크릿 부재 시 encode는 throw(fail-closed)', () => {
    process.env.AUTH_HMAC_SECRET = '';
    expect(() => encodeAuthCookie({ username: 'x', roles: [] })).toThrow();
  });

  it('시크릿 부재 시 decode는 null(fail-closed)', () => {
    const encoded = encodeAuthCookie({ username: 'x', roles: ['SYSTEM_ADMIN'] });
    process.env.AUTH_HMAC_SECRET = '';
    expect(decodeAuthCookieNode(encoded)).toBeNull();
  });
});

describe('decodeAuthCookieEdge — Node 구현과 동일 계약(drift 차단)', () => {
  it('round-trip PASS', async () => {
    const payload = { username: 'edge-user', roles: ['EVENT_ADMIN', 'EVENT_STAFF'] };
    const encoded = encodeAuthCookie(payload);
    const decoded = await decodeAuthCookieEdge(encoded);
    expect(decoded).toEqual(payload);
  });

  it('위변조 payload → decode null', async () => {
    const encoded = encodeAuthCookie({ username: 'admin', roles: ['EVENT_ADMIN'] });
    const [, sig] = encoded.split('.');
    const tamperedB64 = Buffer.from(JSON.stringify({ username: 'attacker', roles: ['SYSTEM_ADMIN'] })).toString(
      'base64',
    );
    const tampered = `${tamperedB64}.${sig}`;
    expect(await decodeAuthCookieEdge(tampered)).toBeNull();
  });

  it('시크릿 상이 → decode null', async () => {
    const encoded = encodeAuthCookie({ username: 'admin', roles: ['EVENT_STAFF'] });
    process.env.AUTH_HMAC_SECRET = 'a-completely-different-secret-value';
    expect(await decodeAuthCookieEdge(encoded)).toBeNull();
  });

  it('Node·Edge 두 구현이 동일 서명값을 산출한다(round-trip 상호 호환)', async () => {
    const payload = { username: 'cross-check', roles: ['SYSTEM_ADMIN'] };
    const encoded = encodeAuthCookie(payload);
    const nodeDecoded = decodeAuthCookieNode(encoded);
    const edgeDecoded = await decodeAuthCookieEdge(encoded);
    expect(nodeDecoded).toEqual(edgeDecoded);
  });
});
