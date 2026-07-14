'use client';

import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/lib/api/stats';

// 갱신주기 15초 — 현장 실시간성과 서버 부하의 절충값. 상수로 박제(설정 UI 등 과잉설계 금지).
export const STATS_REFETCH_INTERVAL_MS = 15_000;

/**
 * 훅 국소 폴링 — `refetchInterval`을 이 훅에만 지정한다(전역 QueryClient의 defaultOptions는
 * 무변경 유지 — 다른 20+ 훅에 폴링이 전파되는 것을 막는다). `refetchIntervalInBackground`는
 * 기본값(false)을 그대로 둬 탭 비활성 시 폴링이 자동으로 멈추게 한다(불필요 부하 절감).
 */
export function useStats(eid: string) {
  return useQuery({
    queryKey: ['console', 'stats', eid], // useZones 규약 미러(['console', <도메인>, eid])
    queryFn: () => getStats(eid),
    refetchInterval: STATS_REFETCH_INTERVAL_MS,
  });
}
