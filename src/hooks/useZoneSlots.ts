'use client';

import { useQuery } from '@tanstack/react-query';
import { listSlotsForQr } from '@/lib/api/console';

/** QR 패널이 열릴 때만 fetch — 목록 화면 진입만으로 선제 호출하지 않는다(enabled 게이팅). */
export function useZoneSlots(eid: string, zid: string, enabled: boolean) {
  return useQuery({
    queryKey: ['console', 'parking-zones', eid, zid, 'slots'],
    queryFn: () => listSlotsForQr(eid, zid),
    enabled: enabled && zid !== 'new',
  });
}
