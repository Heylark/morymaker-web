'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { STAFF_ROLES } from '@/lib/roles';

interface UseRequireStaffResult {
  isStaff: boolean;
  loading: boolean;
}

/** useRequireRole(STAFF_ROLES) 얇은 래퍼 — 호출부 가독성을 위해 실행자 도메인 이름만 씌운다. */
export function useRequireStaff(): UseRequireStaffResult {
  const { hasRole, loading } = useRequireRole(STAFF_ROLES);
  return { isStaff: hasRole, loading };
}
