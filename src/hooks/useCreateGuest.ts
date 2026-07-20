'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGuest } from '@/lib/api/guests';
import type { GuestCreateRequest } from '@/types/guest';

export function useCreateGuest(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GuestCreateRequest) => createGuest(eid, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'guests', eid] }),
  });
}
