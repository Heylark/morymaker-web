'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { ADMIN_ROLES } from '@/lib/roles';

interface UseRequireAdminResult {
  isAdmin: boolean;
  loading: boolean;
}

/** useRequireRole(ADMIN_ROLES) 얇은 래퍼 — 호출부 가독성을 위해 콘솔 도메인 이름만 씌운다. */
export function useRequireAdmin(): UseRequireAdminResult {
  const { hasRole, loading } = useRequireRole(ADMIN_ROLES);
  return { isAdmin: hasRole, loading };
}
