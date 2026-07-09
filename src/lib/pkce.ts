/**
 * PKCE(RFC 7636) verifier/challenge/state 생성 — Web Crypto 사용(Node 런타임에서도 globalThis.crypto로 접근 가능).
 *
 * auth가 requireProofKey(true)로 PKCE를 강제한다 — code_verifier 없이는 인가 코드 교환이
 * invalid_grant로 거부된다. 이 파일은 로그인 개시 단계에서 verifier/challenge 쌍과 CSRF용
 * state를 만드는 순수 함수만 제공한다(쿠키 저장은 호출자 책임).
 */

export interface PkcePair {
  verifier: string;
  challenge: string;
}

/** base64url(패딩 없음) 인코딩 — RFC 7636이 요구하는 문자셋 */
function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * code_verifier + code_challenge(S256) 쌍을 생성한다.
 * verifier: 32바이트 랜덤 → base64url(43자, RFC 7636 최소 43~최대 128자 범위 충족).
 * challenge: base64url(SHA-256(ASCII(verifier))).
 */
export async function createPkcePair(): Promise<PkcePair> {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));

  return { verifier, challenge };
}

/** CSRF 방어용 state nonce — base64url(16바이트 랜덤) */
export function createState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}
