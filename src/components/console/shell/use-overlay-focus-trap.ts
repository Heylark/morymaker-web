'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 오버레이 카드(모달·시트) 공용 포커스 트랩 — `AccountSheet`(U1)·`ConsoleModal`(U3) 양쪽이
 * 공유한다. `registerOverlay()`가 거는 inert는 사이드바·탭바에만 걸리고 물리적 Tab 순서는
 * 막지 않는다(shell-context.ts 주석) — 열릴 때 카드 자체(tabIndex=-1)로 초점을 옮기고, 카드
 * 내부 focusable 사이에서만 Tab이 순환하도록 가두고, 닫힐 때 여는 주체로 초점을 되돌린다.
 *
 * `active`가 false→true로 바뀔 때만 opener를 새로 포착한다 — 열림 상태가 유지되는 동안
 * 리렌더가 일어나도 opener·트랩이 재등록되지 않는다.
 */
export function useOverlayFocusTrap(active: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    // 여는 주체(트리거 버튼 등)는 카드와 별개 형제 노드라 마운트 이후에도 activeElement로
    // 남아 있다 — 닫힐 때 그 요소로 포커스를 되돌린다.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 첫 포커스 대상을 카드 내부 첫 focusable(입력·버튼)로 두면 Enter 오조작 위험이 있어,
    // 카드 컨테이너 자체로 이동시킨다.
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      opener?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return dialogRef;
}
