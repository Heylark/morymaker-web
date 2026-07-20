import { assertRoleOrRedirect } from '@/lib/auth-gate';
import { STAFF_ROLES } from '@/lib/roles';
import { StaffGateClient } from './gate-client';

export default async function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버측 게이트(1차) — 렌더 전 차단이라 클라 훅만 쓸 때 생기는 "콘텐츠 잠깐 노출"이 없다.
  await assertRoleOrRedirect(STAFF_ROLES, '/staff');

  return <StaffGateClient>{children}</StaffGateClient>;
}
