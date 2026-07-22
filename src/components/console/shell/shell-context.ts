'use client';

import { createContext, useContext } from 'react';

export interface ShellOverlayContextValue {
  /** 오버레이(스크림+카드)가 써야 할 기하 클래스 — 셸이 사이드바 폭·탭바 유무를 알고 계산한다. */
  overlayFrameClassName: string;
  /**
   * 오버레이 열림 등록 — 사이드바·탭바 inert 토글. cleanup으로 해제(중첩 카운트).
   * 소비자는 `ConsoleModal`(U3)과 `AccountSheet`(U1) 둘 다다.
   * 헤더·모바일 상단 바는 inert 대상이 아니다 — 그쪽 차단은 스크림 덮음이 담당한다.
   */
  registerOverlay(): () => void;
}

export const ShellOverlayContext = createContext<ShellOverlayContextValue | null>(null);

/** 셸 밖에서 쓰이면 null — 소비자는 전체 화면 fixed로 안전 퇴화한다. */
export function useShellOverlay(): ShellOverlayContextValue | null {
  return useContext(ShellOverlayContext);
}
