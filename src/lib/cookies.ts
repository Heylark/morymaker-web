import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 쿠키 이름 상수 (5종, mm_ prefix).
 *
 * mm_pkce_verifier: 로그인 개시~콜백 사이 PKCE verifier/state/returnTo를 임시 보존한다(무서명 — 위조되어도
 * 교환 실패만 유발할 뿐 인가를 우회하지 못한다. state가 CSRF를 방어한다).
 * mm_auth: 게이트·화면 표시용 사용자 정보 — 위조 시 역할 상승으로 이어지므로 HMAC 서명 대상이다.
 * mm_id_token/mm_access_token/mm_refresh_token: JWT 자체가 서명돼 있어 별도 봉투 서명이 없다.
 */
export const COOKIE_PKCE = 'mm_pkce_verifier';
export const COOKIE_AUTH = 'mm_auth';
export const COOKIE_ID_TOKEN = 'mm_id_token';
export const COOKIE_ACCESS_TOKEN = 'mm_access_token';
export const COOKIE_REFRESH_TOKEN = 'mm_refresh_token';

/** 세션 쿠키 공통 옵션 — refresh_token TTL(24h)에 맞춰 정렬한다(access token 자체 만료는 30분이지만 BFF가 선제 갱신한다). */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24, // 24시간
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

/** 세션 쿠키 만료(삭제) 옵션 — 로그아웃/refresh 실패 시 사용 */
export const COOKIE_EXPIRE_OPTIONS = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: 0,
};

/** PKCE 임시 쿠키 옵션 — 로그인 개시~콜백 사이에만 살아있으면 되는 짧은 수명(600초) */
export const PKCE_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: 600,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

/** mm_auth 쿠키에 담기는 게이트·표시용 사용자 정보 (event_ids는 의도적으로 포함하지 않는다 — api 응답을 신뢰) */
export interface AuthCookiePayload {
  username: string;
  roles: string[];
}

// ─────────────────────────────────────────────────────────────
// 내부 헬퍼: HMAC 시크릿 + fail-closed
// ─────────────────────────────────────────────────────────────

/**
 * AUTH_HMAC_SECRET 환경변수 읽기.
 * non-NEXT_PUBLIC_ 의무 — 브라우저 번들 노출 금지. 비어있으면 null(fail-closed — 호출자가 거부 처리).
 */
function getHmacSecret(): string | null {
  const secret = process.env.AUTH_HMAC_SECRET;
  if (!secret || secret.trim() === '') return null;
  return secret;
}

/** Node.js HMAC-SHA256 계산 — createHmac(secret UTF-8).update(base64문자열 UTF-8).digest(hex) */
function nodeHmacHex(secret: string, b64: string): string {
  return createHmac('sha256', secret).update(b64, 'utf8').digest('hex');
}

// ─────────────────────────────────────────────────────────────
// encode (Node.js 환경 전용 — OAuth callback)
// ─────────────────────────────────────────────────────────────

/**
 * AuthCookiePayload → 서명된 쿠키 문자열 인코딩.
 * 포맷: base64(JSON) + "." + hex(HMAC-SHA256(secret, base64))
 *
 * 시크릿이 비어있으면 throw(fail-closed) — 빈 키로 서명한 쿠키가 발급되는 것을 원천 차단한다.
 * 반환값을 로그에 남기지 않는다(위변조 방어 대상이라 세션 탈취 표면이 된다).
 */
export function encodeAuthCookie(payload: AuthCookiePayload): string {
  const secret = getHmacSecret();
  if (!secret) {
    throw new Error('[AuthCookie] AUTH_HMAC_SECRET이 설정되지 않았습니다 — mm_auth 쿠키를 서명할 수 없습니다.');
  }
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = nodeHmacHex(secret, b64);
  return `${b64}.${sig}`;
}

// ─────────────────────────────────────────────────────────────
// decode (Node.js 환경용 — Route Handler, layout)
// ─────────────────────────────────────────────────────────────

/**
 * 서명된 쿠키 문자열 → AuthCookiePayload 디코딩 (Node.js 런타임).
 *
 * 검증 불변식: 수신 base64 문자열을 그대로(verbatim) HMAC 재계산한다 — 재직렬화하면 키 순서·공백
 * 차이로 서명이 어긋난다. "." 구분자가 없는 무서명 값 / 서명 불일치 / malformed / 필드 누락은
 * 전부 null(untrusted, 재로그인 유도) — 서명이 유효할 때만 payload를 반환한다.
 */
export function decodeAuthCookieNode(value: string): AuthCookiePayload | null {
  try {
    const secret = getHmacSecret();
    if (!secret) return null; // fail-closed: 시크릿 없으면 검증 자체가 불가능

    const dotIdx = value.indexOf('.');
    if (dotIdx < 0) return null; // 무점 legacy/위조값

    const b64Part = value.substring(0, dotIdx);
    const sigPart = value.substring(dotIdx + 1);

    const expectedHex = nodeHmacHex(secret, b64Part);
    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const receivedBuf = Buffer.from(sigPart, 'utf8');

    // timingSafeEqual은 길이 불일치 시 throw — try/catch로 위조 시그니처 방어
    let sigValid = false;
    try {
      sigValid = timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return null;
    }
    if (!sigValid) return null;

    // 서명 검증 통과 후에만 base64 디코딩 (verbatim b64Part — 재직렬화 금지)
    const payload = JSON.parse(Buffer.from(b64Part, 'base64').toString('utf-8'));
    if (typeof payload.username !== 'string') return null;
    if (!Array.isArray(payload.roles) || !payload.roles.every((r: unknown) => typeof r === 'string')) return null;
    return { username: payload.username, roles: payload.roles };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// decode (Edge Runtime용 — 향후 middleware 도입 대비, foundation 미실사용)
// ─────────────────────────────────────────────────────────────

/**
 * 서명된 쿠키 문자열 → AuthCookiePayload 디코딩 (Edge Runtime — Buffer 미사용, crypto.subtle 기반).
 * foundation은 Node 경로만 실사용하지만, 향후 middleware 도입 시 Edge에서도 동일 검증이 필요해
 * 지금 함께 둔다(양쪽 단위 테스트로 drift를 차단).
 */
export async function decodeAuthCookieEdge(value: string): Promise<AuthCookiePayload | null> {
  try {
    const secret = getHmacSecret();
    if (!secret) return null;

    const dotIdx = value.indexOf('.');
    if (dotIdx < 0) return null;

    const b64Part = value.substring(0, dotIdx);
    const sigPart = value.substring(dotIdx + 1);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );

    const sigBytes = hexToBytes(sigPart);
    if (!sigBytes) return null;

    const isValid = await crypto.subtle.verify(
      'HMAC',
      keyMaterial,
      sigBytes.buffer as ArrayBuffer,
      enc.encode(b64Part),
    );
    if (!isValid) return null;

    const json = new TextDecoder().decode(Uint8Array.from(atob(b64Part), (c) => c.charCodeAt(0)));
    const payload = JSON.parse(json);
    if (typeof payload.username !== 'string') return null;
    if (!Array.isArray(payload.roles) || !payload.roles.every((r: unknown) => typeof r === 'string')) return null;
    return { username: payload.username, roles: payload.roles };
  } catch {
    return null;
  }
}

/** lowercase hex 문자열 → Uint8Array 변환 (Edge 내부 헬퍼). 잘못된 hex/홀수 길이 → null. */
function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      if (isNaN(byte)) return null;
      bytes[i / 2] = byte;
    }
    return bytes;
  } catch {
    return null;
  }
}
