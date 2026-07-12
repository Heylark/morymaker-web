interface KioskShellProps {
  children: React.ReactNode;
}

/**
 * 대형 세로 화면 전용 레이아웃 래퍼 — 재사용 컴포넌트의 `max-w-xl`(방문자 모바일 폭)은
 * 무인 대형 디스플레이엔 여백 과다라 부적합하다. 모든 KIO 화면이 이 셸로 감싼다(호출부는
 * `app/(kiosk)/kiosk/[eid]/page.tsx`). 큰 터치 타깃·큰 글씨(무인 원거리) 디자인 토큰을 적용한다.
 */
export function KioskShell({ children }: KioskShellProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-surface-sunken px-6 py-10 text-desk">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">{children}</div>
    </div>
  );
}
