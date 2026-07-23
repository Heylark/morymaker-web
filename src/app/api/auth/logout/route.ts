import { NextRequest, NextResponse } from 'next/server';
import { BASE_PATH } from '@/lib/base-path';
import { getPublicOrigin } from '@/lib/public-origin';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_ID_TOKEN,
  COOKIE_PKCE,
  COOKIE_REFRESH_TOKEN,
} from '@/lib/cookies';

/**
 * GET /api/auth/logout — 한 응답 안에서 (1) id_token 읽기 (2) 쿠키 5종 만료 (3) auth 로그아웃으로
 * 302를 묶는다. 셋을 한 응답으로 묶는 게 핵심이다 — 쿠키를 먼저 지우면 hint를 만들 재료가 사라지고,
 * 두 번의 왕복(POST 후 클라이언트 이동)으로 쪼개면 그 사이에 창을 닫은 사용자의 IdP 세션만
 * 살아남는다(부분 로그아웃). POST는 별칭으로 남기지 않는다 — 잔존 호출자가 405로 시끄럽게
 * 드러나야, 쿠키만 지워지고 IdP 세션이 조용히 살아남는 옛 상태가 은밀히 복원되지 않는다.
 *
 * mm_id_token은 httpOnly라 auth 로그아웃 URL은 서버(이 라우트)가 조립해야 한다 — 페이지 JS는
 * ID 토큰을 한 번도 보지 못한다.
 */
export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request.url);
  const idToken = request.cookies.get(COOKIE_ID_TOKEN)?.value; // 삭제보다 먼저 읽는다
  const loggedOut = new URL(`${BASE_PATH}/logged-out`, origin);

  let destination: URL = loggedOut;
  const issuer = process.env.AUTH_ISSUER;
  if (idToken && issuer) {
    try {
      // issuer는 경로 없는 서브도메인 루트라 new URL(path, base)의 base-path 폐기 성질에 걸리지 않는다.
      const authLogout = new URL('/connect/logout', issuer);
      authLogout.searchParams.set('id_token_hint', idToken);
      // searchParams.set이 인코딩을 담당한다 — 수동 encodeURIComponent를 겹치면 이중 인코딩으로 불일치.
      // 이 문자열은 auth 등록값과 한 글자도 다르면 안 된다(다르면 로그아웃 전체가 거부된다).
      authLogout.searchParams.set('post_logout_redirect_uri', loggedOut.toString());
      destination = authLogout;
    } catch {
      // issuer가 malformed면 최소한 web 종결은 보장한다(로그아웃이 아예 안 되는 상태를 만들지 않는다).
    }
  }

  const res = NextResponse.redirect(destination);
  res.headers.set('Cache-Control', 'no-store');
  res.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ID_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_PKCE, '', COOKIE_EXPIRE_OPTIONS);
  return res;
}
