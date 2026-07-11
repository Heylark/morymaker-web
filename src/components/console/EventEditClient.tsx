'use client';

import { useEvent } from '@/hooks/useEvent';
import { EventForm } from './EventForm';

interface EventEditClientProps {
  eid: string;
}

/**
 * 셸(EventConsoleShell)이 이벤트 조회 성공 시에만 children을 렌더하므로, 이 컴포넌트가
 * 마운트되는 시점엔 `['console','events',eid]` 쿼리가 이미 success 상태다 — useEvent는
 * 캐시 히트로 즉시 채워진다(추가 네트워크 호출 없음, React Query 동일 키 공유).
 * 그래도 타입상 undefined 가능성은 남아 있어 방어적으로 로딩 문구를 둔다.
 */
export function EventEditClient({ eid }: EventEditClientProps) {
  const { data: event } = useEvent(eid);

  if (!event) {
    return <p className="text-ink-muted">불러오는 중...</p>;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">행사 정보 수정</h1>
      <EventForm event={event} />
    </div>
  );
}
