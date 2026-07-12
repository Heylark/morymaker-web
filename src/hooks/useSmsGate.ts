'use client';

import { useQuery } from '@tanstack/react-query';
import { gateSms } from '@/lib/api/sms';

/** 토글(excludeAlreadySent)이 쿼리 키에 포함돼 있어 값이 바뀌면 자동 재조회된다. */
export function useSmsGate(eid: string, excludeAlreadySent: boolean) {
  return useQuery({
    queryKey: ['console', 'sms-gate', eid, excludeAlreadySent],
    queryFn: () => gateSms(eid, excludeAlreadySent),
  });
}
