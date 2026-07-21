'use client';

import { useEvents } from '@/hooks/useEvents';
import { EventList } from '@/components/console/EventList';

/**
 * ADM-01 — 행사 목록(canonical `/events`). `event_ids` 스코프 필터는 api EventService가 이미
 * 적용해 반환한다 — web은 추가 필터링을 수행하지 않는다(SYSTEM_ADMIN은 전체, EVENT_ADMIN은
 * 담당 행사만 온다).
 *
 * 제목·"+ 새 행사" CTA는 `ShellHeader`가 라우트 레지스트리(`console-routes.ts`)로 파생하므로
 * 이 파일은 본문만 소유한다. "계정 관리" 링크도 헤더가 아니라 사이드바 Zone2
 * (`serviceNavItemsFor` — 역할 필터)가 노출하므로 여기서는 제거한다(ADR-005 죽은 affordance
 * 방지 원칙의 일관 적용). `<main>`은 상위 `ConsoleShell`이 소유하므로 이 파일은 `<div>`로
 * 강등해 폭·세로 리듬만 스스로 소유한다(ADR-025).
 */
export default function EventsPage() {
  const { data: events, isLoading, isError } = useEvents();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">행사 목록을 불러오지 못했습니다.</p>}
      {events && <EventList events={events} />}
    </div>
  );
}
