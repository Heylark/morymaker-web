import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';
import { hasAnyRole } from '@/lib/roles';

/**
 * 서버측 게이트(1차) 파라미터화 프리미티브 — 렌더 전 차단이라 클라 훅만 쓸 때 생기는
 * "콘텐츠 잠깐 노출"이 없다. (console)의 layout.tsx가 ADMIN_ROLES를 인라인 검사하던 로직을
 * role 목록 인자로 받는 재사용 가능한 형태로 추출했다 — console 자체는 손대지 않는다(동작 보존).
 */
export async function assertRoleOrRedirect(roles: readonly string[], returnTo: string): Promise<void> {
  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  const payload = auth ? decodeAuthCookieNode(auth.value) : null;
  const authorized = payload !== null && hasAnyRole(payload.roles, roles);

  if (!authorized) {
    redirect(`/oauth/login?returnTo=${returnTo}`);
  }
}
