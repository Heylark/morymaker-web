'use client';

import { useRequireStaff } from '@/hooks/useRequireStaff';
import { StaffEventProvider } from '@/components/staff/StaffEventProvider';

/**
 * 클라 반응형 게이트 부착 지점 — 서버 layout이 초기 진입은 이미 차단했으므로 children을
 * 즉시 렌더한다. useRequireStaff는 마운트 후 백그라운드에서 세션을 재확인해 SPA 네비게이션
 * 중 만료된 세션을 감지하면 로그인으로 되돌린다(서버 게이트가 못 잡는 영역 — 상보 관계).
 *
 * StaffEventProvider는 역할 판정과 무관한 별도 관심사(현재 행사 eid 해석)라 이 훅 호출과
 * 상보·독립으로 감싸기만 한다 — 역할 게이트 판정 로직 자체는 변경하지 않는다.
 *
 * 실행자(staff) 표면은 업무 도구라 게스트 대면 표면과 달리 다크를 강제하지 않는다 — 상위
 * `<html>`이 다크를 전역 강제하는 것과 별개로, 이 래퍼가 자체 `data-theme="light"` 스코프를
 * 걸어 하위 트리(로딩/빈행사/미지원 안내 화면 + 실 화면 전부)를 라이트로 렌더한다. 키오스크
 * 표면의 다크 고정 래퍼(app/(kiosk)/layout.tsx)와 대칭 구조 — 신규 토큰 없이 기존
 * `[data-theme="light"]` 재매핑 블록만 활성화한다.
 */
export function StaffGateClient({ children }: { children: React.ReactNode }) {
  useRequireStaff();
  return (
    <div data-theme="light" className="min-h-dvh bg-[var(--void)] text-[var(--ivory)]">
      <StaffEventProvider>{children}</StaffEventProvider>
    </div>
  );
}
