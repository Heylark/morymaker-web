'use client';

import { useQuery } from '@tanstack/react-query';
import { listSmsLog } from '@/lib/api/sms';

export function useSmsLog(eid: string) {
  return useQuery({ queryKey: ['console', 'sms-log', eid], queryFn: () => listSmsLog(eid) });
}
