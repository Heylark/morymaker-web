'use client';

import { useQuery } from '@tanstack/react-query';
import { listEvents } from '@/lib/api/console';

export function useEvents() {
  return useQuery({ queryKey: ['console', 'events'], queryFn: () => listEvents() });
}
