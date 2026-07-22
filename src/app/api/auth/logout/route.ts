import { NextResponse } from 'next/server';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_AUTH,
  COOKIE_EXPIRE_OPTIONS,
  COOKIE_ID_TOKEN,
  COOKIE_PKCE,
  COOKIE_REFRESH_TOKEN,
} from '@/lib/cookies';

/**
 * POST /api/auth/logout — 로컬 쿠키 5종 삭제를 수행한다.
 * auth 측 커스텀 로그아웃(revoke) 엔드포인트가 아직 없어 외부 호출은 하지 않는다(foundation 범위 —
 * revoke 엔드포인트가 추가되면 이 라우트에서 호출을 보강한다).
 *
 * mm_pkce_verifier도 함께 지운다 — 이 쿠키는 평소엔 로그인 왕복 사이에만 잠깐 존재하지만,
 * 로그아웃 시점에 완료되지 않은 셸 내비게이션 프리페치가 쿠키 삭제 이후에도 계속 실행되며
 * middleware→/oauth/login을 다시 태워 새로 심을 수 있다(프리페치 자체는 셸 링크
 * prefetch={false}로 억제하되, 이 삭제는 그래도 남는 경합의 마지막 방어선이다).
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_AUTH, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ID_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', COOKIE_EXPIRE_OPTIONS);
  res.cookies.set(COOKIE_PKCE, '', COOKIE_EXPIRE_OPTIONS);
  return res;
}
