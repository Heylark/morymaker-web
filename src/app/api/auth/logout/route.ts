import { NextResponse } from 'next/server';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_ID_TOKEN,
  COOKIE_REFRESH_TOKEN,
} from '@/lib/cookies';

/**
 * POST /api/auth/logout — 로컬 쿠키 4종 삭제만 수행한다.
 * auth 측 커스텀 로그아웃(revoke) 엔드포인트가 아직 없어 외부 호출은 하지 않는다(foundation 범위 —
 * revoke 엔드포인트가 추가되면 이 라우트에서 호출을 보강한다).
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ID_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  return res;
}
