'use client';

import { useQuery } from '@tanstack/react-query';
import { getEvent } from '@/lib/api/console';

export function useEvent(eid: string) {
  return useQuery({ queryKey: ['console', 'events', eid], queryFn: () => getEvent(eid) });
}
