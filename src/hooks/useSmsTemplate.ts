'use client';

import { useQuery } from '@tanstack/react-query';
import { getSmsTemplate } from '@/lib/api/sms';

export function useSmsTemplate(eid: string) {
  return useQuery({ queryKey: ['console', 'sms-template', eid], queryFn: () => getSmsTemplate(eid) });
}
