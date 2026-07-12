'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertSmsTemplate } from '@/lib/api/sms';
import type { SmsTemplateUpdateRequest } from '@/types/sms';

export function useUpdateSmsTemplate(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SmsTemplateUpdateRequest) => upsertSmsTemplate(eid, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'sms-template', eid] }),
  });
}
