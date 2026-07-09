import { describe, expect, it } from 'vitest';
import { createPkcePair, createState } from './pkce';

describe('createPkcePair', () => {
  it('verifier가 RFC 7636 길이 범위(43~128자)를 만족한다', async () => {
    const { verifier } = await createPkcePair();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('verifier/challenge가 base64url 문자셋만 사용한다(+, /, = 없음)', async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('challenge는 verifier의 SHA-256(S256) 다이제스트다', async () => {
    const { verifier, challenge } = await createPkcePair();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const expected = Buffer.from(digest).toString('base64url').replace(/=+$/, '');
    expect(challenge).toBe(expected);
  });

  it('매 호출마다 서로 다른 verifier를 생성한다(랜덤성)', async () => {
    const a = await createPkcePair();
    const b = await createPkcePair();
    expect(a.verifier).not.toBe(b.verifier);
  });
});

describe('createState', () => {
  it('state가 매 호출마다 다른 값을 생성한다(CSRF nonce)', () => {
    expect(createState()).not.toBe(createState());
  });
});
