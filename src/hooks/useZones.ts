'use client';

import { useQuery } from '@tanstack/react-query';
import { listZones } from '@/lib/api/console';

export function useZones(eid: string) {
  return useQuery({ queryKey: ['console', 'parking-zones', eid], queryFn: () => listZones(eid) });
}
