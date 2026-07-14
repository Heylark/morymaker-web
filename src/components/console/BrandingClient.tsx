'use client';

import { useEvent } from '@/hooks/useEvent';
import { BrandingForm } from './BrandingForm';
import { IdleContentManager } from './IdleContentManager';

interface BrandingClientProps {
  eid: string;
}

/**
 * ADM-04 브랜딩·대기화면 최종 조립 — EventEditClient와 동일 이유로 `useEvent(eid)`를 다시
 * 호출한다: 셸(EventConsoleShell)이 이벤트 조회 성공 시에만 children을 렌더하므로 이 컴포넌트가
 * 마운트되는 시점엔 `['console','events',eid]` 쿼리가 이미 success 상태라 캐시 히트로 즉시
 * 채워진다(추가 네트워크 호출 없음). 그래도 타입상 undefined 가능성은 남아 있어 방어적으로
 * 로딩 문구를 둔다. 최상위 `<div>`(셸이 이미 `<main>`을 보유 — SeatsClient·RosterClient와
 * 동일한 랜드마크 중복 방지 관용구, `<main>` 재사용 금지).
 */
export function BrandingClient({ eid }: BrandingClientProps) {
  const { data: event } = useEvent(eid);

  if (!event) {
    return <p className="text-ink-muted">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">브랜딩 · 대기화면</h1>
      <BrandingForm eid={eid} event={event} />
      <IdleContentManager eid={eid} />
    </div>
  );
}
