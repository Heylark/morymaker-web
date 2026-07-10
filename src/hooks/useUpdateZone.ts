'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateZone } from '@/lib/api/console';
import type { ZoneUpdateRequest } from '@/types/console';

export function useUpdateZone(eid: string, zid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ZoneUpdateRequest) => updateZone(eid, zid, req),
    onSuccess: () => {
      // 구획 목록 + 이 구획의 자리(slotCount·타이틀 변경 시 QR 라벨/개수 반영) 둘 다 무효화
      qc.invalidateQueries({ queryKey: ['console', 'parking-zones', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'parking-zones', eid, zid, 'slots'] });
    },
  });
}
