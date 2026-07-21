import { assertRoleOrRedirect } from '@/lib/auth-gate';
import { STAFF_ROLES } from '@/lib/roles';
import { LandingGateClient } from './gate-client';

/**
 * `/landing`은 `(console)` 그룹에 넣지 않는다 — 그 그룹 게이트가 `ADMIN_ROLES`라
 * `EVENT_STAFF`가 `/forbidden`으로 튕기고, 그룹 gate-client가 라이트를 강제해 "로그인 이후
 * 유일한 다크 관리 화면"이 성립하지 않는다.
 */
export default async function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버측 게이트(1차) — 렌더 전 차단. returnTo는 canonical 자기 경로(/landing)로 지정한다.
  await assertRoleOrRedirect(STAFF_ROLES, '/landing');

  return <LandingGateClient>{children}</LandingGateClient>;
}
