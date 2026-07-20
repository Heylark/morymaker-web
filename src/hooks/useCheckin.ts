'use client';

import { useMutation } from '@tanstack/react-query';
import { checkin } from '@/lib/api/staff';
import type { CheckinRequest } from '@/types/staff';

export function useCheckin(eid: string) {
  return useMutation({
    mutationFn: (request: CheckinRequest) => checkin(eid, request),
  });
}
