'use client';

import { useQuery } from '@tanstack/react-query';
import { getHub } from '@/lib/api/visitor';

export function useHub(token: string) {
  return useQuery({
    queryKey: ['visitor', 'hub', token],
    queryFn: () => getHub(token),
  });
}
