'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEvent } from '@/lib/api/console';
import type { EventUpdateRequest } from '@/types/console';

export function useUpdateEvent(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EventUpdateRequest) => updateEvent(eid, req),
    onSuccess: () => {
      // 목록 + 이 행사 단건 둘 다 무효화 — 셸 배너·수정 폼이 최신 값을 즉시 반영하게 한다.
      qc.invalidateQueries({ queryKey: ['console', 'events'] });
      qc.invalidateQueries({ queryKey: ['console', 'events', eid] });
    },
  });
}
