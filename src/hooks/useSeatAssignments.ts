'use client';

import { useQuery } from '@tanstack/react-query';
import { listSeatAssignments } from '@/lib/api/seats';

/**
 * groupNo가 아직 선택되지 않은 상태(배정 편집을 열기 전)에서는 조회 자체를 건너뛴다.
 * useGuests에는 없는 게이트인 이유는 명단은 화면 진입과 동시에 항상 조회하지만, 배정은
 * "그룹을 먼저 선택"이 전제 조건이라 groupNo 미확정 구간이 존재하기 때문이다.
 */
export function useSeatAssignments(eid: string, groupNo: number | undefined) {
  return useQuery({
    queryKey: ['console', 'seatAssignments', eid, groupNo],
    queryFn: () => listSeatAssignments(eid, groupNo as number),
    enabled: groupNo !== undefined,
  });
}
