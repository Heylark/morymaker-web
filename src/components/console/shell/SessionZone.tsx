'use client';

import { useMe } from '@/hooks/useMe';
import { BASE_PATH } from '@/lib/base-path';
import { displayNameOf, initialOf, roleLabelOf } from '@/lib/session-display';

interface SessionZoneProps {
  /** sidebar=세로 최하단 고정 / bar=랜딩 우상단 가로 / sheet=모바일 시트 내부 */
  variant: 'sidebar' | 'bar' | 'sheet';
}

/**
 * 아바타+이름+역할+로그아웃 — 사이드바·랜딩·계정시트 3곳 공용.
 *
 * 로그아웃은 web 쿠키만 지우고 하드 내비게이션으로 `/logged-out`에 착지한다(성공/실패 무관 —
 * TanStack Query 캐시·셸 상태를 통째로 버려야 이전 세션 잔상이 남지 않는다). 목적지를
 * `/oauth/login`으로 두지 않는 이유: `POST /api/auth/logout`이 IdP 세션을 종결하지 않아
 * auth가 살아 있는 세션을 폼 없이 재인정 — 사용자가 로그아웃 화면을 한 번도 보지 못한 채
 * 같은 계정으로 재로그인된다(공용 태블릿 계정 유출 경로). `window.location`은 외부 좌표계라
 * BASE_PATH 수동 접두가 필수다.
 */
export function SessionZone({ variant }: SessionZoneProps) {
  const { data: me } = useMe();
  const username = me?.user?.username;
  const roles = me?.user?.roles ?? null;

  async function handleLogout() {
    try {
      await fetch(`${BASE_PATH}/api/auth/logout`, { method: 'POST' });
    } finally {
      window.location.assign(`${BASE_PATH}/logged-out`);
    }
  }

  const containerClass =
    variant === 'sidebar'
      ? 'mt-auto flex items-center gap-3 border-t border-line-soft px-4 py-4'
      : variant === 'bar'
        ? 'flex items-center gap-3'
        : 'flex items-center gap-3 py-2';

  return (
    <div className={containerClass}>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-[var(--card)] text-sm font-semibold text-[var(--champagne)]"
      >
        {initialOf(username)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={username ?? undefined}>
          {displayNameOf(username)}
        </p>
        <p className="truncate text-xs text-ink-muted">{roleLabelOf(roles)}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 text-xs font-medium text-ink-muted hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
