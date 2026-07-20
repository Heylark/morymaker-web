'use client';

import { useRequireAdmin } from '@/hooks/useRequireAdmin';

/**
 * 클라 반응형 게이트 부착 지점 — 서버 layout이 초기 진입은 이미 차단했으므로 children을
 * 즉시 렌더한다. useRequireAdmin은 마운트 후 백그라운드에서 세션을 재확인해 SPA 네비게이션
 * 중 만료된 세션을 감지하면 로그인으로 되돌린다(서버 게이트가 못 잡는 영역 — 상보 관계).
 *
 * 관리자 콘솔은 업무 화면이라 게스트 대면 표면과 달리 다크를 강제하지 않는다 — 상위 `<html>`이
 * 다크를 전역 강제하는 것과 별개로, 이 래퍼가 자체 `data-theme="light"` 스코프를 걸어 하위
 * 트리(행사 목록·행사 편집·명단·초대 등 콘솔 전체)를 라이트로 렌더한다. 실행자(staff) 표면의
 * 동일 wrapper 패턴을 그대로 미러링 — 신규 토큰 없이 기존 `[data-theme="light"]` 재매핑
 * 블록만 활성화한다.
 *
 * `data-console-scope`는 콘솔 입력 전용 스타일(iOS 자동 확대 방지)의 CSS 선택자 앵커다.
 * 실행자(staff) 표면도 동일하게 `data-theme="light"`를 쓰므로 그 속성만으로는 콘솔만 골라낼
 * 수 없어 별도 마커가 필요하다.
 */
export function ConsoleGateClient({ children }: { children: React.ReactNode }) {
  useRequireAdmin();
  return (
    <div data-theme="light" data-console-scope className="min-h-dvh bg-[var(--void)] text-[var(--ivory)]">
      {children}
    </div>
  );
}
