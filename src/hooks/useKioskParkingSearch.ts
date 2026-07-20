'use client';

import { useQuery } from '@tanstack/react-query';
import { parkingSearch } from '@/lib/api/kiosk';
import { kioskKeys, PLATE_TAIL_PATTERN } from '@/lib/kiosk/constants';

/**
 * 차량 뒷자리 4자리 클라 게이트(api `^\d{4}$` 검증과 동일 패턴, 400 회피). 3상태는 meta 없이
 * 이 훅을 소비하는 컴포넌트가 반환된 배열 길이로 계산한다(§0 실측 정정 — 이름검색과 소스 비대칭).
 */
export function useKioskParkingSearch(eid: string, plateTail: string) {
  return useQuery({
    queryKey: kioskKeys.parking(eid, plateTail),
    queryFn: () => parkingSearch(eid, plateTail),
    enabled: PLATE_TAIL_PATTERN.test(plateTail),
    retry: false,
  });
}
