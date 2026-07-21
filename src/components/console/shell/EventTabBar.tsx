'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EVENT_TABBAR_ITEMS, isNavItemActive } from '@/lib/console-nav';

interface EventTabBarProps {
  eid: string;
  inert?: boolean;
}

/**
 * 기존 하단 탭바 이식 — 5항목·라벨·aria 그대로(핸드오프 §4 "변경 없음"). `md:hidden` 전용,
 * `z-50`은 회귀 0으로 유지한다(§5 z 스케일). 오버레이(모달·계정 시트)가 열리면 `inert`로
 * 히트테스트를 차단한다 — z 값만으로는 딤 위에 남은 탭바 클릭이 통과한다(ADR-030 실증).
 */
export function EventTabBar({ eid, inert }: EventTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      inert={inert}
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line-soft bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {EVENT_TABBAR_ITEMS.map((item) => {
        const href = item.path(eid);
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={item.key}
            href={href}
            prefetch={false}
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
  );
}
