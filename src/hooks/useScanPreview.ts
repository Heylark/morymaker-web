'use client';

import { useQuery } from '@tanstack/react-query';
import { scanPreview } from '@/lib/api/staff';

/** token이 없으면(이름검색 폴백 경로) 호출하지 않는다 — scanPreview endpoint는 token 전용이다. */
export function useScanPreview(eid: string, token: string | null) {
  return useQuery({
    queryKey: ['staff', 'scan-preview', eid, token],
    queryFn: () => scanPreview(eid, token as string),
    enabled: !!token,
  });
}
