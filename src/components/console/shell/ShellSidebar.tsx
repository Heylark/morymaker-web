'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEvent } from '@/hooks/useEvent';
import { useMe } from '@/hooks/useMe';
import { EVENT_NAV_ITEMS, isNavItemActive, isServiceNavItemActive, serviceNavItemsFor } from '@/lib/console-nav';
import { ADMIN_ROLES, hasAnyRole } from '@/lib/roles';
import { SessionZone } from './SessionZone';

interface ShellSidebarProps {
  eid: string | undefined;
  inert?: boolean;
}

const ACTIVE_CLASS = 'bg-[var(--card)] font-bold text-[var(--champagne)]';
const INACTIVE_CLASS = 'text-[var(--muted)] hover:text-[var(--ivory)]';

/**
 * eid 컨텍스트가 있을 때만 마운트되는 Zone3 — `useEvent`가 조건부 훅 호출 규칙을 지키도록
 * 별도 컴포넌트로 분리한다(ConsoleShell 3-5 설계와 동일 패턴).
 */
function EventContextZone({ eid, pathname }: { eid: string; pathname: string | null }) {
  const { data: event } = useEvent(eid);

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4">
      <p className="eyebrow px-4">관리 중인 행사</p>
      <p className="truncate px-4 text-sm font-semibold text-ink">{event?.name ?? ''}</p>
      <nav aria-label="행사 메뉴" className="flex flex-col gap-1">
        {EVENT_NAV_ITEMS.map((item) => {
          const href = item.path(eid);
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`min-h-touch flex items-center rounded-[var(--radius-sharp)] px-4 text-sm ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Zone1~4 사이드바(md↑ 전용). props는 `eid`(있으면 Zone3 렌더) 하나뿐 — 나머지는 자체 훅으로
 * 도출한다(usePathname·useMe). `md 미만`은 하단 탭바가 대신하므로 렌더 자체를 숨긴다.
 */
export function ShellSidebar({ eid, inert }: ShellSidebarProps) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const roles = me?.user?.roles ?? null;
  const isAdmin = hasAnyRole(roles ?? [], ADMIN_ROLES);
  const serviceItems = serviceNavItemsFor(roles, me?.user?.eventIds);

  return (
    <aside
      aria-label="콘솔 사이드바"
      inert={inert}
      className="sticky top-0 hidden h-dvh w-[var(--shell-sidebar-w)] shrink-0 flex-col border-r border-line-soft bg-[var(--void)] md:flex"
    >
      <div className="flex h-[var(--shell-header-h)] shrink-0 items-center gap-2 border-b border-line-soft px-4">
        {isAdmin ? (
          <Link href="/events" className="flex items-center gap-2">
            <span className="font-[var(--serif)] text-lg text-[var(--champagne)]">M</span>
            <span className="text-sm font-semibold tracking-wide text-ink">MORYMAKER</span>
          </Link>
        ) : (
          // ADMIN_ROLES가 아닌 사용자(EVENT_STAFF)에게 /events 링크를 노출하면 클릭 시
          // /forbidden으로 튕기는 죽은 affordance가 된다 — 정적 텍스트로 대체한다.
          <span className="flex items-center gap-2">
            <span className="font-[var(--serif)] text-lg text-[var(--champagne)]">M</span>
            <span className="text-sm font-semibold tracking-wide text-ink">MORYMAKER</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav aria-label="서비스" className="flex flex-col gap-1 p-3">
          <p className="key-label px-1 pb-1">서비스</p>
          {serviceItems.map((item) => {
            const active = isServiceNavItemActive(pathname, item.href, eid);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`min-h-touch flex items-center rounded-[var(--radius-sharp)] px-3 text-sm ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {eid && <EventContextZone eid={eid} pathname={pathname} />}
      </div>

      <SessionZone variant="sidebar" />
    </aside>
  );
}
