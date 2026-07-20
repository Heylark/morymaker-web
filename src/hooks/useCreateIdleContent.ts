'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createIdleContent } from '@/lib/api/idle-contents';
import type { IdleContentCreateRequest } from '@/types/idle-content';

interface CreateIdleContentVars {
  file: File;
  request: IdleContentCreateRequest;
}

export function useCreateIdleContent(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, request }: CreateIdleContentVars) => createIdleContent(eid, file, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'idleContents', eid] }),
  });
}
