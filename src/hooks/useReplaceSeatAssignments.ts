'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { replaceSeatAssignments } from '@/lib/api/seats';
import type { SeatAssignmentBulkUpdateRequest } from '@/types/seat';

/**
 * 저장 성공 시 편집한 그룹의 배정 뷰(정확한 groupNo)와 그룹 목록의 배정 수·좌석 수
 * (assignedCount/slotCount 변동)를 함께 갱신한다. groupNo는 mutate 호출 시 넘긴 request에
 * 담겨 있으므로 onSuccess의 variables에서 그대로 꺼내 쓴다(재조회 불필요).
 */
export function useReplaceSeatAssignments(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: SeatAssignmentBulkUpdateRequest) => replaceSeatAssignments(eid, request),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['console', 'seatAssignments', eid, variables.groupNo] });
      qc.invalidateQueries({ queryKey: ['console', 'seatGroups', eid] });
    },
  });
}
