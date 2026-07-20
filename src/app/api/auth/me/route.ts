import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS_TOKEN, COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';
import { extractEventIds } from '@/lib/tokens';

/**
 * GET /api/auth/me — mm_auth 쿠키 디코딩(외부 호출 없음, 항상 200) + eventIds 병기.
 * useRequireAdmin/useRequireStaff 반응형 세션 확인과 StaffEventProvider의 현재 행사 해석이
 * 이 엔드포인트를 공유한다.
 *
 * eventIds는 mm_auth 스키마 밖이다(행사 식별자 배제 결정은 그대로 보존) — access token 쿠키
 * (권위 JWT)에서 이 호출 시점마다 새로 도출하는 비권위 UI 힌트일 뿐이며, 실 인가는 여전히
 * api EventScopeGuard가 담당한다. mm_auth 디코딩(username·roles)은 기존 그대로 손대지 않는다.
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

  // access token 쿠키 부재는 "클레임 없음"(SYSTEM_ADMIN 전체허용)과 혼동하면 안 되므로 빈 배열로
  // 안전 수렴한다(정상 세션이면 mm_auth와 access token은 항상 함께 설정·회전되어 실무상 발생하지 않는다).
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  const eventIds = accessToken ? extractEventIds(accessToken) : [];

  return NextResponse.json({ user: { ...payload, eventIds } });
}
