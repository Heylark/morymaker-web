'use client';

import { useQuery } from '@tanstack/react-query';
import { listEvents } from '@/lib/api/console';

interface UseEventsOptions {
  /**
   * 기본 true. 랜딩의 "진행 중 행사 수" 카드처럼 `ADMIN_ROLES`가 아닌 세션에서는 호출 자체를
   * 하지 않아야 하는 소비처가 `enabled: false`를 넘긴다(§7 데이터 계약 — 403 소음 방지).
   * 기존 호출부(인자 없이 호출)는 항상 true라 동작이 그대로 보존된다.
   */
  enabled?: boolean;
}

export function useEvents(options?: UseEventsOptions) {
  return useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => listEvents(),
    enabled: options?.enabled ?? true,
  });
}
