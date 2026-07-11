import { assertRoleOrRedirect } from '@/lib/auth-gate';
import { ADMIN_ROLES } from '@/lib/roles';
import { ConsoleGateClient } from './gate-client';

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버측 게이트(1차) — 렌더 전 차단이라 클라 훅만 쓸 때 생기는 "콘텐츠 잠깐 노출"이 없다.
  // returnTo는 canonical 목록 경로(/events)로 직접 지정한다 — /console 리다이렉트 홉을 절감한다.
  await assertRoleOrRedirect(ADMIN_ROLES, '/events');

  return <ConsoleGateClient>{children}</ConsoleGateClient>;
}
