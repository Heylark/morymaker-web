'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBranding } from '@/lib/api/branding';
import type { EventBrandingUpdateRequest } from '@/types/console';

export function useUpdateBranding(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EventBrandingUpdateRequest) => updateBranding(eid, req),
    onSuccess: () => {
      // 브랜딩 조회는 useEvent(eid)를 재사용하므로, useUpdateEvent와 동일하게 목록 + 단건 둘 다
      // 무효화한다 — 셸 배너·브랜딩 폼이 저장 직후 최신 값을 즉시 반영하게 한다.
      qc.invalidateQueries({ queryKey: ['console', 'events'] });
      qc.invalidateQueries({ queryKey: ['console', 'events', eid] });
    },
  });
}
