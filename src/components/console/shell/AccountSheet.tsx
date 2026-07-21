'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMe } from '@/hooks/useMe';
import { serviceNavItemsFor } from '@/lib/console-nav';
import { SessionZone } from './SessionZone';
import { useShellOverlay } from './shell-context';

interface AccountSheetProps {
  onClose: () => void;
}

const TITLE_ID = 'account-sheet-title';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 모바일 계정 시트 — 로컬 state 오버레이(라우팅 아님). ConsoleShell이 존재 자체로 열림 상태를
 * 표현한다(`{accountSheetOpen && <AccountSheet .../>}`) — 마운트 시 registerOverlay()를 호출해
 * 사이드바·탭바에 inert를 건다.
 *
 * 오버레이 프레임은 `useShellOverlay()`의 `overlayFrameClassName`을 그대로 소비한다(ConsoleModal과
 * 동일 구조) — 시트 전용 z-40 스크림을 따로 두면 탭바(z-50)가 딤 위에서 클릭을 통과시킨다
 * (ADR-030). 마운트 지점은 `ConsoleShell`의 마지막 자식으로 고정 — `ShellHeader`가
 * `sticky top-0 z-30`(스태킹 컨텍스트)이라 그 하위에 두면 오히려 더 확실히 탭바 아래로 가라앉는다.
 */
export function AccountSheet({ onClose }: AccountSheetProps) {
  const overlay = useShellOverlay();
  const { data: me } = useMe();
  const items = serviceNavItemsFor(me?.user?.roles ?? null, me?.user?.eventIds);
  const dialogRef = useRef<HTMLDivElement>(null);

  // registerOverlay()가 거는 inert는 사이드바·탭바에만 걸리고(shell-context.ts 주석) 물리적
  // 탭 순서는 막지 않는다 — DOM 순서상 시트가 ConsoleShell의 마지막 자식이라 열자마자 Tab을
  // 누르면 스크림 아래 본문으로 새 나간다. 여기서 포커스 이동·트랩·복귀를 직접 구현한다.
  useEffect(() => {
    const unregister = overlay?.registerOverlay();
    document.body.style.overflow = 'hidden';

    // 여는 주체(아바타 버튼)는 시트와 별개 형제 노드라 마운트 이후에도 언마운트되지 않고
    // activeElement로 남아 있다 — 닫을 때 그 요소로 포커스를 되돌린다.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 첫 포커스 대상을 로그아웃 버튼(SessionZone 내 첫 focusable) 등 실행 가능한 컨트롤로
    // 두면 Enter 오조작 위험이 있어, 다이얼로그 컨테이너 자체(tabIndex=-1)로 이동시킨다.
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
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
      unregister?.();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      opener?.focus();
    };
    // 마운트/언마운트 = 열림/닫힘이므로 등록·해제는 마운트 시점 1회로 고정한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameClassName = overlay?.overlayFrameClassName ?? 'fixed inset-0 z-50';

  return (
    <div className={`${frameClassName} md:hidden`} role="presentation">
      <div data-theme="dark" onClick={onClose} aria-hidden className="absolute inset-0 bg-[var(--void)] opacity-60" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        tabIndex={-1}
        data-theme="light"
        data-console-scope
        className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-[var(--radius-frame)] border border-line-soft bg-surface p-4 [box-shadow:var(--shadow-kiosk)]"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-[var(--line-soft)]" />
        <h2 id={TITLE_ID} className="text-sm font-semibold text-ink">
          계정
        </h2>
        <SessionZone variant="sheet" />
        <nav aria-label="서비스" className="flex flex-col gap-1 border-t border-line-soft pt-3">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className="min-h-touch flex items-center rounded-[var(--radius-sharp)] px-3 text-sm text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={onClose}
          className="min-h-touch rounded-[var(--radius-sharp)] border border-line-soft text-sm text-ink-muted"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
