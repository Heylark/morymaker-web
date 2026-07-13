'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSeatGroup } from '@/lib/api/seats';
import type { SeatGroupCreateRequest } from '@/types/seat';

export function useCreateSeatGroup(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SeatGroupCreateRequest) => createSeatGroup(eid, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'seatGroups', eid] }),
  });
}
