'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSeatGroup } from '@/lib/api/seats';
import type { SeatGroupUpdateRequest } from '@/types/seat';

interface UpdateSeatGroupVars {
  gid: string;
  request: SeatGroupUpdateRequest;
}

/**
 * gid를 훅 생성 시점이 아닌 mutate 호출 시 변수로 받는다 — useUpdateGuest와 동일 이유(목록 한
 * 화면에 그룹이 여러 개라 행마다 훅을 새로 만들 필요가 없다).
 *
 * numbering 토글이 이 훅을 통해 전송된다 — api가 배정을 재해석하므로(ON→OFF는 ord를 9999로
 * 강제, assignedCount/slotCount도 변동) 그룹 목록뿐 아니라 배정 뷰도 함께 무효화해야 한다.
 * groupNo를 모르는 시점이라 prefix(`['console','seatAssignments',eid]`)로 무효화한다 —
 * TanStack invalidateQueries는 기본 exact:false라 하위 groupNo 쿼리까지 모두 매칭된다.
 */
export function useUpdateSeatGroup(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gid, request }: UpdateSeatGroupVars) => updateSeatGroup(eid, gid, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'seatGroups', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'seatAssignments', eid] });
    },
  });
}
