'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { resolveHeaderMeta, type RouteParams } from '@/lib/console-routes';
import { AccountSheet } from './AccountSheet';
import { EventTabBar } from './EventTabBar';
import { ShellHeader } from './ShellHeader';
import { ShellSidebar } from './ShellSidebar';
import { ShellOverlayContext, type ShellOverlayContextValue } from './shell-context';

interface ConsoleShellProps {
  children: React.ReactNode;
}

/**
 * 셸 루트 — props가 `children` 하나뿐인 것이 핵심 계약이다. eid·역할·헤더 내용·활성 항목은
 * 전부 셸 내부에서 usePathname()+useParams()로 도출한다(슬롯 주입이 아니라 라우트 파생 —
 * React에 Vue Teleport가 없기 때문). 하위 페이지는 셸에 아무것도 등록하지 않는다.
 *
 * 중첩 셸 금지 — 이 컴포넌트는 `(console)/gate-client.tsx`와 `staff/scan/layout.tsx`
 * 두 곳에서만 렌더된다.
 */
export function ConsoleShell({ children }: ConsoleShellProps) {
  const pathname = usePathname();
  // useParams()의 제네릭 제약(`Params = Record<string, ParamValue>`)은 인덱스 시그니처를
  // 요구해 좁은 RouteParams(§3-2 계약 — eid·zid만 소유)를 타입 인자로 직접 넘길 수 없다.
  // 넓은 Params를 받은 뒤 필요한 두 세그먼트만 좁혀서 계약 타입으로 재구성한다.
  const rawParams = useParams();
  const params: RouteParams = {
    eid: typeof rawParams.eid === 'string' ? rawParams.eid : undefined,
    zid: typeof rawParams.zid === 'string' ? rawParams.zid : undefined,
  };
  const eid = params.eid;
  const meta = resolveHeaderMeta(pathname, params);

  const [overlayCount, setOverlayCount] = useState(0);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const overlayOpen = overlayCount > 0;

  // 중첩 카운트 — 모달·계정 시트가 동시에 열려도 inert 해제 시점이 어긋나지 않는다.
  const registerOverlay = useCallback(() => {
    setOverlayCount((count) => count + 1);
    return () => setOverlayCount((count) => Math.max(0, count - 1));
  }, []);

  // §6 모달 오버레이 기하 — md↑는 사이드바 폭만큼 밀려 콘텐츠 열만 덮고, 탭바가 렌더 중이면
  // 그 위까지만 덮는다(하단 44px+safe-area 오프셋). 계정 시트도 동일 프레임을 공유한다(ADR-030).
  const overlayFrameClassName = useMemo(() => {
    const base =
      'fixed inset-0 z-50 md:left-[var(--shell-sidebar-w)] md:flex md:items-center md:justify-center md:p-4';
    const tabbarOffset = eid ? ' bottom-[calc(var(--space-44)+env(safe-area-inset-bottom))] md:bottom-0' : '';
    return `${base}${tabbarOffset}`;
  }, [eid]);

  const overlayContextValue = useMemo<ShellOverlayContextValue>(
    () => ({ overlayFrameClassName, registerOverlay }),
    [overlayFrameClassName, registerOverlay],
  );

  return (
    <ShellOverlayContext.Provider value={overlayContextValue}>
      <div className="flex min-h-dvh bg-[var(--void)]">
        <ShellSidebar eid={eid} inert={overlayOpen} />

        {/* min-w-0 없이는 flex 자식의 기본 min-width:auto가 하위 표(overflow-x-auto)의 내부
            스크롤을 무력화한다 — 제거 금지. */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <ShellHeader meta={meta} eid={eid} onOpenAccountSheet={() => setAccountSheetOpen(true)} />
          {/* p-6 pb-24 md:pb-6 — 하위 페이지가 자체 패딩을 갖지 않는다는 기존 계약. 폭은 하위가
              소유한다(ADR-025) — 이 <main>은 폭을 제약하지 않는다. */}
          <main className="flex-1 p-6 pb-24 md:pb-6">{children}</main>
        </div>

        {eid && <EventTabBar eid={eid} inert={overlayOpen} />}
      </div>

      {accountSheetOpen && <AccountSheet onClose={() => setAccountSheetOpen(false)} />}
    </ShellOverlayContext.Provider>
  );
}
