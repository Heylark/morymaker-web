'use client';

import Link from 'next/link';
import { useEvents } from '@/hooks/useEvents';
import { EventList } from '@/components/console/EventList';

/**
 * ADM-01 — 행사 목록(canonical `/events`). 기존 `console/page.tsx`의 raw fetch/useState를
 * React Query로 대체한다. `event_ids` 스코프 필터는 api EventService가 이미 적용해 반환한다 —
 * web은 추가 필터링을 수행하지 않는다(SYSTEM_ADMIN은 전체, EVENT_ADMIN은 담당 행사만 온다).
 */
export default function EventsPage() {
  const { data: events, isLoading, isError } = useEvents();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">행사 목록</h1>
        <Link
          href="/events/new"
          className="min-h-touch flex items-center rounded-card bg-primary px-4 text-sm font-semibold text-primary-ink"
        >
          + 새 행사
        </Link>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">행사 목록을 불러오지 못했습니다.</p>}
      {events && <EventList events={events} />}
    </main>
  );
}
