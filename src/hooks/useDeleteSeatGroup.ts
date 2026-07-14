'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSeatGroup } from '@/lib/api/seats';

interface DeleteSeatGroupVars {
  gid: string;
}

/** FK CASCADE로 그룹 삭제 시 배정도 함께 삭제된다 — 배정 뷰도 prefix로 함께 무효화(stale 슬롯 방지). */
export function useDeleteSeatGroup(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gid }: DeleteSeatGroupVars) => deleteSeatGroup(eid, gid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'seatGroups', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'seatAssignments', eid] });
    },
  });
}
