'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendSms } from '@/lib/api/sms';
import type { SmsSendRequest } from '@/types/sms';

export function useSendSms(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SmsSendRequest) => sendSms(eid, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'sms-gate', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'sms-log', eid] });
    },
  });
}
