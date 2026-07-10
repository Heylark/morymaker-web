'use client';

import { useQuery } from '@tanstack/react-query';
import { getOnsiteForm } from '@/lib/api/visitor';

export function useOnsiteForm(eventCode: string) {
  return useQuery({
    queryKey: ['visitor', 'onsite-form', eventCode],
    queryFn: () => getOnsiteForm(eventCode),
  });
}
