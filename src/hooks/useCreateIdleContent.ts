'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createIdleContent } from '@/lib/api/idle-contents';
import type { IdleContentCreateRequest } from '@/types/idle-content';

export function useCreateIdleContent(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: IdleContentCreateRequest) => createIdleContent(eid, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'idleContents', eid] }),
  });
}
