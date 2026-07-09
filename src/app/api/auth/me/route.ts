import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';

/**
 * GET /api/auth/me — mm_auth 쿠키 디코딩만(외부 호출 없음, 항상 200).
 * useRequireAdmin 클라 훅의 반응형 세션 확인이 이 엔드포인트를 호출한다.
 */
export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  if (!auth) {
    return NextResponse.json({ user: null });
  }

  const payload = decodeAuthCookieNode(auth.value);
  if (!payload) {
    // 무서명 legacy / 서명 불일치 / malformed → 로그아웃 신호(untrusted)
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: payload });
}
