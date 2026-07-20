'use client';

import { useQuery } from '@tanstack/react-query';
import { previewSms } from '@/lib/api/sms';

/** guestId 미선택 시 비활성(enabled:false) — TemplatePreview가 대상 게스트를 고른 후에만 호출. */
export function useSmsPreview(eid: string, guestId: string | null) {
  return useQuery({
    queryKey: ['console', 'sms-preview', eid, guestId],
    queryFn: () => previewSms(eid, guestId as string),
    enabled: !!guestId,
  });
}
