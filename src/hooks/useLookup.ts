'use client';

import { useQuery } from '@tanstack/react-query';
import { lookup } from '@/lib/api/staff';

/** 검색어가 비어 있으면 호출하지 않는다 — 빈 문자열 검색은 서버가 어떻게 응답하든 UX상 불필요하다. */
export function useLookup(eid: string, q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ['staff', 'lookup', eid, trimmed],
    queryFn: () => lookup(eid, trimmed),
    enabled: trimmed.length > 0,
  });
}
