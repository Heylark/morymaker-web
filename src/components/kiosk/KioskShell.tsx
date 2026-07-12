interface KioskShellProps {
  children: React.ReactNode;
}

/**
 * 대형 세로 화면 전용 레이아웃 래퍼 — 재사용 컴포넌트의 `max-w-xl`(방문자 모바일 폭)은
 * 무인 대형 디스플레이엔 여백 과다라 부적합하다. 모든 KIO 화면이 이 셸로 감싼다(호출부는
 * `app/(kiosk)/kiosk/[eid]/page.tsx`). 큰 터치 타깃·큰 글씨(무인 원거리) 디자인 토큰을 적용한다.
 *
 * 배경은 디바이스 프레임 앰비언트(중앙 하단에서 은은하게 번지는 골드 그라데이션) + 표면 명도 —
 * 실제 배포 화면은 뷰포트 자체가 디바이스 프레임이라 별도 "룸(void)" 계층이 없어, 프레임 배경을
 * 뷰포트 전체 배경으로 승격한다. 카드 명도(구 bg-surface-sunken)는 이 계층에 맞지 않아 제외했다.
 */
export function KioskShell({ children }: KioskShellProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-10 text-desk [background:var(--ambient-kiosk),var(--surface)]">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">{children}</div>
    </div>
  );
}
