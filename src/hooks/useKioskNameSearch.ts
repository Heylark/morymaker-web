'use client';

import { useQuery } from '@tanstack/react-query';
import { nameSearch } from '@/lib/api/kiosk';
import { kioskKeys, MIN_NAME_LENGTH } from '@/lib/kiosk/constants';

/**
 * 이름 min 2자 클라 게이트(400 회피) — `useLookup`(실행자)과 이름이 겹치지 않도록 `useKiosk*`
 * 접두를 쓴다(훅 명명 충돌 회피, 설계 §1). 4xx는 결정적이라 재시도하지 않는다.
 */
export function useKioskNameSearch(eid: string, name: string) {
  const trimmed = name.trim();
  return useQuery({
    queryKey: kioskKeys.attendees(eid, trimmed),
    queryFn: () => nameSearch(eid, trimmed),
    enabled: trimmed.length >= MIN_NAME_LENGTH,
    retry: false,
  });
}
