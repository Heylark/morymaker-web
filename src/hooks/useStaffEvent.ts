'use client';

import { useContext } from 'react';
import { StaffEventContext, type StaffEventContextValue } from '@/components/staff/StaffEventProvider';

/**
 * StaffEventProvider가 해석한 현재 행사(eid)를 소비한다. Provider는 eid가 확정되기 전에는
 * children 자체를 렌더하지 않으므로, 이 훅이 호출되는 시점엔 eid가 항상 문자열로 존재한다.
 */
export function useStaffEvent(): StaffEventContextValue {
  const ctx = useContext(StaffEventContext);
  if (!ctx) {
    throw new Error('useStaffEvent는 StaffEventProvider 하위에서만 호출할 수 있습니다.');
  }
  return ctx;
}
