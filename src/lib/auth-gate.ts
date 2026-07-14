import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';
import { FORBIDDEN_PATH, resolveGateOutcome } from '@/lib/roles';

/**
 * 서버측 게이트(1차) 파라미터화 프리미티브 — 렌더 전 차단이라 클라 훅만 쓸 때 생기는
 * "콘텐츠 잠깐 노출"이 없다. (console)의 layout.tsx가 ADMIN_ROLES를 인라인 검사하던 로직을
 * role 목록 인자로 받는 재사용 가능한 형태로 추출했다 — console 자체는 손대지 않는다(동작 보존).
 *
 * 미인증(로그인 필요)과 인증+role불충족(재인증해도 무의미)을 구분한다 — 둘 다 로그인으로
 * 보내면, 이미 로그인한 사용자가 재인증 후 같은 role로 돌아와 다시 차단되는 무한 리다이렉트가
 * 생긴다. resolveGateOutcome가 두 실패 사유를 나누고, 여기서는 그 판정에 맞는 목적지로만
 * 보낸다(returnTo는 미인증 분기에만 의미가 있다 — 불충족은 재방문할 이유가 없는 종결 화면).
 */
export async function assertRoleOrRedirect(roles: readonly string[], returnTo: string): Promise<void> {
  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  const payload = auth ? decodeAuthCookieNode(auth.value) : null;
  const outcome = resolveGateOutcome(payload?.roles ?? null, roles);

  if (outcome === 'UNAUTHENTICATED') {
    redirect(`/oauth/login?returnTo=${returnTo}`);
  }
  if (outcome === 'FORBIDDEN') {
    redirect(FORBIDDEN_PATH);
  }
}
