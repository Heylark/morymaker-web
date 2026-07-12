'use client';

import { useQuery } from '@tanstack/react-query';
import { listGuests } from '@/lib/api/guests';
import type { GuestSearchFilters } from '@/types/guest';

export function useGuests(eid: string, filters: GuestSearchFilters = {}) {
  return useQuery({
    queryKey: ['console', 'guests', eid, filters],
    queryFn: () => listGuests(eid, filters),
  });
}
