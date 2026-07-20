'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelGuest } from '@/lib/api/guests';

interface CancelGuestVars {
  gid: string;
}

/** deleteSmsLog는 항상 false 고정(UI 미노출) — cancelGuest 기본값을 그대로 둔다. */
export function useCancelGuest(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gid }: CancelGuestVars) => cancelGuest(eid, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'guests', eid] }),
  });
}
