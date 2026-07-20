'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resendSms } from '@/lib/api/sms';
import type { SmsResendRequest } from '@/types/sms';

export function useResendSms(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SmsResendRequest) => resendSms(eid, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'sms-log', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'sms-gate', eid] });
    },
  });
}
