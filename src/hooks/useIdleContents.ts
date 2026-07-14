'use client';

import { useQuery } from '@tanstack/react-query';
import { listIdleContents } from '@/lib/api/idle-contents';

export function useIdleContents(eid: string) {
  return useQuery({
    queryKey: ['console', 'idleContents', eid],
    queryFn: () => listIdleContents(eid),
  });
}
