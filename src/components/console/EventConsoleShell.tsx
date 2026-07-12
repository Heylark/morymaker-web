'use client';

import Link from 'next/link';
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
  { key: 'seats', label: '좌석', path: (eid) => `/events/${eid}/seats`, implemented: false },
  { key: 'branding', label: '브랜딩', path: (eid) => `/events/${eid}/branding`, implemented: false },
  { key: 'stats', label: '통계', path: (eid) => `/events/${eid}/stats`, implemented: false },
];

/**
 * eid 컨텍스트 셸 — 사이드바 + "관리 중인 행사" 배너 + [← 행사 목록].
 * useEvent(BFF 경유)로 배너를 채우고, 조회 성공 시에만 children을 렌더한다(무효 eid에서
 * 하위 페이지가 자체 api 호출을 시도하는 것을 막는다). 사이드바·뒤로가기는 조회 상태와
 * 무관하게 즉시 렌더한다 — 크롬(chrome)까지 조회 완료를 기다릴 이유가 없다.
 */
export function EventConsoleShell({ eid, children }: EventConsoleShellProps) {
  const { data: event, isLoading, isError, error } = useEvent(eid);
  const errorCode = error instanceof ConsoleApiError ? error.code : null;

  return (
    <div className="flex min-h-dvh bg-surface-sunken">
      <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-black/10 bg-surface p-4">
        <Link href="/events" className="text-sm text-ink-muted hover:text-ink">
          ← 행사 목록
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => item.implemented).map((item) => (
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

      <div className="flex flex-1 flex-col">
        <header className="border-b border-black/10 bg-surface px-6 py-4">
          {event && <p className="text-desk font-semibold text-ink">관리 중인 행사: {event.name}</p>}
        </header>

        <main className="flex-1 p-6">
          {isLoading && <p className="text-ink-muted">확인 중...</p>}
          {isError && errorCode === 'NOT_FOUND' && <p className="text-ink-muted">행사를 찾을 수 없습니다.</p>}
          {isError && errorCode === 'EVENT_FORBIDDEN' && <p className="text-ink-muted">담당 행사가 아닙니다.</p>}
          {isError && errorCode !== 'NOT_FOUND' && errorCode !== 'EVENT_FORBIDDEN' && (
            <p className="text-danger">행사 정보를 불러오지 못했습니다.</p>
          )}
          {event && children}
        </main>
      </div>
    </div>
  );
}
