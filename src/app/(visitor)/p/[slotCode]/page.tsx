import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SlotView } from '@/components/visitor/SlotView';
import { COOKIE_AUTH, decodeAuthCookieNode } from '@/lib/cookies';
import { hasAnyRole, STAFF_ROLES } from '@/lib/roles';

interface SlotPageProps {
  params: Promise<{ slotCode: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * 공개 자리 QR 진입 셸 — 실행자 로그인 세션을 감지하면 주차 보드로 안내하지만, 이는 순전히
 * 편의를 위한 리다이렉트일 뿐 보안 경계가 아니다(mm_auth는 비권위 UI 힌트). 쿠키가 없거나
 * 디코드에 실패해도 항상 공개 셀프 주차 폼으로 패스스루한다(fail-open) — 방문자는 로그인
 * 여부와 무관하게 항상 이 화면에 접근할 수 있어야 한다.
 */
export default async function SlotPage({ params, searchParams }: SlotPageProps) {
  const { slotCode } = await params;
  const { token } = await searchParams;

  const cookieStore = await cookies();
  const auth = cookieStore.get(COOKIE_AUTH);
  const payload = auth ? decodeAuthCookieNode(auth.value) : null;

  if (payload && hasAnyRole(payload.roles, STAFF_ROLES)) {
    // redirect()는 basePath를 자동으로 붙인다 — 수동 prepend 시 basePath가 2중 적용된다.
    redirect('/staff/parking-board');
  }

  return <SlotView slotCode={slotCode} token={token} />;
}
