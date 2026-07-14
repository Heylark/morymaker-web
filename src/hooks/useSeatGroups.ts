'use client';

import { useQuery } from '@tanstack/react-query';
import { listSeatGroups } from '@/lib/api/seats';

export function useSeatGroups(eid: string) {
  return useQuery({
    queryKey: ['console', 'seatGroups', eid],
    queryFn: () => listSeatGroups(eid),
  });
}
