import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';
import { ConsoleGateClient } from './gate-client';

const ADMIN_ROLES = ['SYSTEM_ADMIN', 'EVENT_ADMIN'];

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버측 게이트(1차) — 렌더 전 차단이라 클라 훅만 쓸 때 생기는 "콘텐츠 잠깐 노출"이 없다.
  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  const payload = auth ? decodeAuthCookieNode(auth.value) : null;
  const hasAdminRole = payload?.roles.some((r) => ADMIN_ROLES.includes(r)) ?? false;

  if (!payload || !hasAdminRole) {
    redirect('/oauth/login?returnTo=/console');
  }

  return <ConsoleGateClient>{children}</ConsoleGateClient>;
}
