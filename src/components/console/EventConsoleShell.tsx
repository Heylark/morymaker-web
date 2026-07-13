'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEvent } from '@/hooks/useEvent';
import { ConsoleApiError } from '@/lib/api/console';

interface EventConsoleShellProps {
  eid: string;
  children: React.ReactNode;
}

interface NavItem {
  key: string;
  label: string;
  path: (eid: string) => string;
  implemented: boolean;
}

/**
 * 향후 하위 REQ가 채울 메뉴 자리까지 미리 정의해두되, 아직 라우트가 없는 항목은
 * implemented:false로 남겨 렌더에서 제외한다 — 죽은 링크(클릭해도 404)를 노출하지 않는다.
 * 각 하위 REQ 착수 시 해당 항목의 implemented만 true로 바꾸면 된다.
 */
const NAV_ITEMS: NavItem[] = [
  { key: 'parking', label: '주차', path: (eid) => `/events/${eid}/parking`, implemented: true },
  { key: 'guests', label: '명단', path: (eid) => `/events/${eid}/roster`, implemented: true },
  { key: 'seats', label: '좌석', path: (eid) => `/events/${eid}/seats`, implemented: true },
  { key: 'branding', label: '브랜딩', path: (eid) => `/events/${eid}/branding`, implemented: false },
  { key: 'stats', label: '통계', path: (eid) => `/events/${eid}/stats`, implemented: false },
];

/**
 * 하단 탭바 활성 항목 판정 — 정확히 일치하거나 슬래시 경계로 시작하는 하위 경로만 활성으로
 * 본다. 단순 `startsWith(href)`는 `/events/e1/parking`이 `/events/e1/parking2`도 활성으로
 * 잘못 판정하는 경계 오류가 있어 `${href}/` 접두만 하위 경로로 인정한다.
 */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * eid 컨텍스트 셸 — 사이드바 + "관리 중인 행사" 배너 + [← 행사 목록].
 * useEvent(BFF 경유)로 배너를 채우고, 조회 성공 시에만 children을 렌더한다(무효 eid에서
 * 하위 페이지가 자체 api 호출을 시도하는 것을 막는다). 사이드바·뒤로가기는 조회 상태와
 * 무관하게 즉시 렌더한다 — 크롬(chrome)까지 조회 완료를 기다릴 이유가 없다.
 */
export function EventConsoleShell({ eid, children }: EventConsoleShellProps) {
  const { data: event, isLoading, isError, error } = useEvent(eid);
  const errorCode = error instanceof ConsoleApiError ? error.code : null;
  const pathname = usePathname();
  const implementedItems = NAV_ITEMS.filter((item) => item.implemented);

  return (
    <div className="flex min-h-dvh bg-surface-sunken">
      {/* md 미만은 하단 고정 탭바가 대신하므로 사이드바를 렌더에서 제외한다(폭 224px가
          375px 뷰포트를 압착하던 원인 — 아래 하단 탭바로 완전히 대체). md 이상은 기존
          레이아웃 그대로 유지해 데스크톱 회귀가 없다. */}
      <aside className="hidden w-56 shrink-0 flex-col gap-4 border-r border-black/10 bg-surface p-4 md:flex">
        <Link href="/events" className="text-sm text-ink-muted hover:text-ink">
          ← 행사 목록
        </Link>
        <nav className="flex flex-col gap-1">
          {implementedItems.map((item) => (
            <Link
              key={item.key}
              href={item.path(eid)}
              className="min-h-touch flex items-center rounded-card px-3 text-sm text-ink hover:bg-surface-sunken"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* min-w-0 없이는 flex 자식의 기본 min-width:auto가 하위 표(overflow-x-auto)의 내부
          스크롤을 무력화해 좁은 화면에서 콘텐츠가 컨테이너 밖으로 밀려나며 배경이 끊긴다 —
          nav 렌더 방식과 무관하게 항상 필요하다. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-black/10 bg-surface px-6 py-4">
          {event && <p className="text-desk font-semibold text-ink">관리 중인 행사: {event.name}</p>}
        </header>

        {/* pb-24는 하단 고정 탭바(md 미만)에 콘텐츠 끝부분이 가려지지 않도록 하는 여유 공간 —
            탭바 자체가 없는 md 이상에서는 원래 p-6과 동일하게 되돌린다. */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          {isLoading && <p className="text-ink-muted">확인 중...</p>}
          {isError && errorCode === 'NOT_FOUND' && <p className="text-ink-muted">행사를 찾을 수 없습니다.</p>}
          {isError && errorCode === 'EVENT_FORBIDDEN' && <p className="text-ink-muted">담당 행사가 아닙니다.</p>}
          {isError && errorCode !== 'NOT_FOUND' && errorCode !== 'EVENT_FORBIDDEN' && (
            <p className="text-danger">행사 정보를 불러오지 못했습니다.</p>
          )}
          {event && children}
        </main>
      </div>

      {/* md 미만 전용 하단 고정 탭바 — 현장에서 폰을 한 손으로 쥔 채 엄지로 바로 닿는 위치에
          항상 노출한다(드로어처럼 열기 동작을 추가하지 않음). safe-area 여백은 하단 홈 인디케이터가
          있는 기기에서 탭 영역이 잘리지 않도록 한다. */}
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-black/10 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {implementedItems.map((item) => {
          const href = item.path(eid);
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-touch flex-1 items-center justify-center text-sm ${
                active ? 'font-semibold text-primary' : 'text-ink-muted'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
