'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface RosterTabsProps {
  eid: string;
}

/**
 * export 이유: path 빌더가 앱 좌표계(basePath 없음)를 반환함을 단위 테스트로 고정한다 — 이
 * 컴포넌트는 EventConsoleShell과 달리 aria-current·E2E 활성 단언이 없어(무방비 지점), 이
 * 단위 테스트가 이중 접두(/app/app) 회귀를 잡는 유일한 자동 게이트다.
 */
export const TABS = [
  { key: 'roster', label: '명단·발송', path: (eid: string) => `/events/${eid}/roster` },
  { key: 'template', label: '초대 문자 템플릿', path: (eid: string) => `/events/${eid}/roster/template` },
];

/** 명단관리 하위 탭 nav — 각 탭은 독립 조회라 전환 시 상태 유실이 없다(각자 자체 React Query 캐시). */
export function RosterTabs({ eid }: RosterTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-line-soft">
      {TABS.map((tab) => {
        const href = tab.path(eid);
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`min-h-touch flex items-center border-b-2 px-4 text-sm font-semibold ${
              active ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
