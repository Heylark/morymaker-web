'use client';

import { useEvent } from '@/hooks/useEvent';
import { ConsoleApiError } from '@/lib/api/console';

interface EventScopeGateProps {
  eid: string;
  children: React.ReactNode;
}

/**
 * eid 유효성 게이트 — 기존 `EventConsoleShell`의 조회 분기를 문구까지 그대로 이식한다.
 * 성공 시에만 children을 렌더한다(무효 eid에서 하위 페이지가 자체 api를 때리는 것을 막던
 * 기존 계약 보존). 크롬(사이드바·헤더·탭바)은 렌더하지 않는다 — 셸이 상위에 이미 있다.
 *
 * `useEvent(eid)` 호출은 셸과 중복이지만 동일 queryKey라 네트워크 요청은 1건이다
 * (TanStack Query 캐시 공유).
 */
export function EventScopeGate({ eid, children }: EventScopeGateProps) {
  const { data: event, isLoading, isError, error } = useEvent(eid);
  const errorCode = error instanceof ConsoleApiError ? error.code : null;

  if (isLoading) return <p className="text-ink-muted">확인 중...</p>;
  if (isError && errorCode === 'NOT_FOUND') return <p className="text-ink-muted">행사를 찾을 수 없습니다.</p>;
  if (isError && errorCode === 'EVENT_FORBIDDEN') return <p className="text-ink-muted">담당 행사가 아닙니다.</p>;
  if (isError) return <p className="text-danger">행사 정보를 불러오지 못했습니다.</p>;

  return event ? <>{children}</> : null;
}
