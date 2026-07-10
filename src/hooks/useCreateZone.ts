'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createZone } from '@/lib/api/console';
import type { ZoneCreateRequest } from '@/types/console';

export function useCreateZone(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ZoneCreateRequest) => createZone(eid, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'parking-zones', eid] }),
  });
}
