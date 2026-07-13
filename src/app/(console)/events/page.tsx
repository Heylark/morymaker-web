'use client';

import Link from 'next/link';
import { useEvents } from '@/hooks/useEvents';
import { useMe } from '@/hooks/useMe';
import { EventList } from '@/components/console/EventList';
import { hasAnyRole, SYSTEM_ADMIN_ROLES } from '@/lib/roles';

/**
 * ADM-01 — 행사 목록(canonical `/events`). 기존 `console/page.tsx`의 raw fetch/useState를
 * React Query로 대체한다. `event_ids` 스코프 필터는 api EventService가 이미 적용해 반환한다 —
 * web은 추가 필터링을 수행하지 않는다(SYSTEM_ADMIN은 전체, EVENT_ADMIN은 담당 행사만 온다).
 *
 * "계정 관리" 링크는 SYSTEM_ADMIN에게만 노출한다(장식용 조건부 렌더 — 실제 접근 차단은
 * `/accounts` 자체의 서버·클라 이중 게이트 + auth 403이 담당하므로 여기서 숨긴다고 보안이
 * 성립하는 것은 아니다). `EventConsoleShell`이 아닌 이 파일에 두는 이유는 -03(seats) 병렬
 * 세션이 그 셸 파일을 편집 중이라 충돌을 피하기 위함이다.
 */
export default function EventsPage() {
  const { data: events, isLoading, isError } = useEvents();
  const { data: me } = useMe();
  const isSystemAdmin = hasAnyRole(me?.user?.roles ?? [], SYSTEM_ADMIN_ROLES);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">행사 목록</h1>
        <div className="flex items-center gap-4">
          {isSystemAdmin && (
            <Link href="/accounts" className="text-sm font-medium text-ink-muted hover:text-ink">
              계정 관리
            </Link>
          )}
          <Link
            href="/events/new"
            className="min-h-touch flex items-center rounded-card bg-primary px-4 text-sm font-semibold text-primary-ink"
          >
            + 새 행사
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">행사 목록을 불러오지 못했습니다.</p>}
      {events && <EventList events={events} />}
    </main>
  );
}
