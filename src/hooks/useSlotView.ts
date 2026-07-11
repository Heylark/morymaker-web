'use client';

import { useQuery } from '@tanstack/react-query';
import { getSlotView } from '@/lib/api/visitor';

export function useSlotView(slotCode: string) {
  return useQuery({
    queryKey: ['visitor', 'slot-view', slotCode],
    queryFn: () => getSlotView(slotCode),
  });
}
