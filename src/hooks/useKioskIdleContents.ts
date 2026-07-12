'use client';

import { useQuery } from '@tanstack/react-query';
import { idleContents } from '@/lib/api/kiosk';
import { kioskKeys } from '@/lib/kiosk/constants';

/** fail-open 응답이라 에러가 드물다 — 그래도 결정적 실패는 재시도하지 않는다(다른 kiosk 훅과 정합). */
export function useKioskIdleContents(eid: string) {
  return useQuery({
    queryKey: kioskKeys.idle(eid),
    queryFn: () => idleContents(eid),
    retry: false,
  });
}
