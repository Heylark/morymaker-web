/**
 * refreshTokens — 순수 네트워크 함수. 쿠키 읽기/쓰기는 호출자(BFF 프록시, /api/auth/refresh)가 담당한다.
 *
 * auth가 reuseRefreshTokens=false(RFC 9700 §4.14.2)로 동작해 매 refresh마다 새 access_token과
 * 새 refresh_token이 함께 발급된다. 소비된(구) refresh_token을 재제시하면 grace 기간(30초)
 * 초과 시 auth가 family 전체를 kill한다 — 호출자는 반환된 refreshToken을 반드시 쿠키에 반영해야
 * 다음 refresh가 옛 토큰을 재제시하는 사고를 막는다(이 함수 자체는 그 책임을 지지 않는다).
 */

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet | null> {
  try {
    const credentials = Buffer.from(
      `${process.env.AUTH_CLIENT_ID}:${process.env.AUTH_CLIENT_SECRET}`,
    ).toString('base64');
    const res = await fetch(new URL('/oauth2/token', process.env.AUTH_ISSUER), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return null;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    };
  } catch {
    return null;
  }
}
