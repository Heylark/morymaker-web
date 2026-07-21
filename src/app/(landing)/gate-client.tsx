'use client';

import { useRequireStaff } from '@/hooks/useRequireStaff';

/**
 * 클라 반응형 게이트 부착 지점 — 서버 layout이 초기 진입은 이미 차단했으므로 children을
 * 즉시 렌더한다. useRequireStaff는 마운트 후 백그라운드에서 세션을 재확인해 SPA 네비게이션
 * 중 만료된 세션을 감지하면 로그인으로 되돌린다(서버 게이트가 못 잡는 영역 — 상보 관계).
 *
 * 셸 없음·테마 래퍼 없음 — 상위 `<html data-theme="dark">`가 이미 다크이므로 그대로 상속한다
 * (콘솔·스태프 gate-client처럼 `data-theme="light"` 스코프를 걸지 않는다 — 로그인 이후 유일한
 * 다크 관리 화면이라는 계약이 이 부재로 성립한다).
 */
export function LandingGateClient({ children }: { children: React.ReactNode }) {
  useRequireStaff();
  return <>{children}</>;
}
