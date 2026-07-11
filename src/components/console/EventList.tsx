'use client';

import Link from 'next/link';
import type { EventResponse } from '@/types/console';

interface EventListProps {
  events: EventResponse[];
}

/** 행사 목록 표현부 — 0건 빈 상태를 포함한다. 데이터 조회는 페이지가 useEvents로 수행해 넘긴다. */
export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <p className="text-ink-muted">등록된 행사가 없습니다. 위쪽 [+ 새 행사]로 첫 행사를 만들어보세요.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-desk font-semibold text-ink">{event.name}</span>
            <span className="text-sm text-ink-muted">{event.status}</span>
          </div>
          <div className="flex gap-4">
            <Link href={`/events/${event.id}/parking`} className="text-sm font-medium text-primary">
              관리
            </Link>
            <Link href={`/events/${event.id}/edit`} className="text-sm font-medium text-ink-muted hover:text-ink">
              수정
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
