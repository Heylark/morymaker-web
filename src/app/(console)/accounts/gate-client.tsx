'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { SYSTEM_ADMIN_ROLES } from '@/lib/roles';

/**
 * 클라 반응형 게이트(2차) — 서버 layout이 초기 진입을 이미 차단했으므로 children을 즉시 렌더한다.
 * useRequireRole은 마운트 후 세션을 재확인해 SPA 네비게이션 중 만료·역할변경을 감지한다.
 *
 * 상위 `ConsoleGateClient`가 이미 `data-theme="light" data-console-scope` div로 감싸므로, 이
 * 래퍼는 테마·스코프 div를 재중첩하지 않는다(얇은 게이트만 — 재중첩하면 스코프 이중화 버그).
 */
export function AccountsGateClient({ children }: { children: React.ReactNode }) {
  useRequireRole(SYSTEM_ADMIN_ROLES);
  return <>{children}</>;
}
