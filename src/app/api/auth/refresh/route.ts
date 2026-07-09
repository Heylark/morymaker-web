import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_ID_TOKEN,
  COOKIE_REFRESH_TOKEN,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/cookies';
import { refreshTokens } from '@/lib/auth-refresh';

function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ID_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
}

/**
 * POST /api/auth/refresh — 클라이언트가 명시적으로 세션 갱신을 요청하는 경로.
 *
 * auth가 reuseRefreshTokens=false로 매 refresh마다 새 refresh_token을 발급한다 — access와
 * refresh 쿠키를 함께 회전시키지 않으면 다음 refresh가 이미 소비된 옛 토큰을 재제시해 grace
 * 기간(30초) 초과 시 family 전체가 kill된다(회전 누락 = 정상 사용자 강제 로그아웃). 실패 시
 * 세션 복구가 불가능하므로 fail-closed로 즉시 로그아웃 처리한다.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 });
  }

  const tokenSet = await refreshTokens(refreshToken);
  if (!tokenSet) {
    const res = NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  // 회전 계약 — access와 refresh를 반드시 함께 갱신한다(§7, family-kill 회피의 핵심 제약).
  res.cookies.set(COOKIE_ACCESS_TOKEN, tokenSet.accessToken, SESSION_COOKIE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, tokenSet.refreshToken, SESSION_COOKIE_OPTIONS);
  if (tokenSet.idToken) {
    res.cookies.set(COOKIE_ID_TOKEN, tokenSet.idToken, SESSION_COOKIE_OPTIONS);
  }
  return res;
}
