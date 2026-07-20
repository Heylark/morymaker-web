'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchKioskBranding } from '@/lib/api/kiosk';
import { kioskKeys } from '@/lib/kiosk/constants';

/** fail-closed 응답 — 결정적 실패(404/409)는 재시도하지 않는다(다른 kiosk 훅과 정합). 에러 시 데이터 부재로 BrandingScope가 시스템 기본색 유지. */
export function useKioskBranding(eid: string) {
  return useQuery({
    queryKey: kioskKeys.branding(eid),
    queryFn: () => fetchKioskBranding(eid),
    retry: false,
  });
}
