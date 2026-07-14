import { assertRoleOrRedirect } from '@/lib/auth-gate';
import { SYSTEM_ADMIN_ROLES } from '@/lib/roles';
import { AccountsGateClient } from './gate-client';

/**
 * SYSTEM_ADMIN 전용 중첩 게이트 — 상위 `(console)/layout.tsx`는 ADMIN_ROLES(SYSTEM_ADMIN+
 * EVENT_ADMIN)를 허용해 EVENT_ADMIN을 과허용한다(콘솔 전체 진입은 통과). 계정 관리는 auth가
 * hasRole(SYSTEM_ADMIN) 단일 게이트라, 이 중첩 layout이 렌더 전 서버 차단(1차)으로 EVENT_ADMIN을
 * 걸러낸다 — 진짜 인가는 여전히 auth 403(방어심층 최종)이다.
 */
export default async function AccountsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertRoleOrRedirect(SYSTEM_ADMIN_ROLES, '/accounts');

  return <AccountsGateClient>{children}</AccountsGateClient>;
}
