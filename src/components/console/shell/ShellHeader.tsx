'use client';

import Link from 'next/link';
import { useEvent } from '@/hooks/useEvent';
import { useMe } from '@/hooks/useMe';
import type { HeaderMeta } from '@/lib/console-routes';
import { statusPillTone } from '@/lib/console-routes';
import { initialOf } from '@/lib/session-display';
import { StatePill } from '@/components/shared/StatePill';
import type { EventResponse } from '@/types/console';

interface ShellHeaderProps {
  meta: HeaderMeta | null;
  eid: string | undefined;
  onOpenAccountSheet: () => void;
}

/**
 * `useEvent(eid)`는 eid가 있을 때만 호출해야 하는데 훅은 조건부 호출이 불가하므로, 이 하위
 * 컴포넌트를 `eid && <EventHeaderData eid={eid}>`로 조건부 마운트해 그 안에서 호출한다
 * (ConsoleShell 설계와 동일 패턴). 데스크톱·모바일 두 마크업이 같은 queryKey를 공유해
 * 네트워크 요청은 1건이다.
 */
function EventHeaderData({ eid, children }: { eid: string; children: (event: EventResponse | undefined) => React.ReactNode }) {
  const { data: event } = useEvent(eid);
  return <>{children(event)}</>;
}

const BACK_BUTTON_CLASS =
  'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-line text-ink';

/**
 * md↑ 헤더 — 목록형(제목+CTA)·상세형(← + eyebrow + 행사명 + 상태 pill) 2변형.
 * `hidden … md:flex` 필수 — 모바일 상단 바(md:hidden)와 같은 헤더가 CSS로 배타 렌더하는
 * 구조라, 이게 없으면 375px에서 헤더가 세로 2단으로 쌓이고 CTA가 2개가 된다.
 */
function DesktopHeader({ meta, eid }: { meta: HeaderMeta | null; eid: string | undefined }) {
  if (!meta) return null;

  if (meta.variant === 'list') {
    return (
      <header className="sticky top-0 z-30 hidden h-[var(--shell-header-h)] items-center gap-[var(--space-10)] border-b border-line-soft bg-surface px-6 md:flex">
        <h1 className="text-desk-lg font-semibold text-ink">{meta.title}</h1>
        {meta.action && (
          <Link
            href={meta.action.href}
            className="ml-auto min-h-touch flex items-center rounded-card bg-primary px-4 text-sm font-semibold text-primary-ink"
          >
            {meta.action.label}
          </Link>
        )}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 hidden h-[var(--shell-header-h)] items-center gap-[var(--space-10)] border-b border-line-soft bg-surface px-6 md:flex">
      <Link href={meta.backHref} aria-label="이전으로" className={BACK_BUTTON_CLASS}>
        ←
      </Link>
      <div>
        <p className="eyebrow">{meta.eyebrow}</p>
        {eid && (
          <EventHeaderData eid={eid}>
            {(event) => (
              <div className="flex items-center gap-3">
                <h1 className="text-desk-lg font-semibold text-ink">{event?.name ?? ''}</h1>
                {event && <StatePill tone={statusPillTone(event.status)}>{event.status}</StatePill>}
              </div>
            )}
          </EventHeaderData>
        )}
      </div>
    </header>
  );
}

/**
 * md 미만 상단 바 — ← / 위치 / (CTA) / 아바타. CTA는 §4가 규정한 3요소(← · 위치 · 아바타)에는
 * 없는 4번째 요소지만, `/events`·`/accounts`의 생성 CTA가 U1에서 본문에서 제거되므로 이게
 * 없으면 모바일 생성 진입점이 완전히 사라진다(§12 통지 항목).
 */
function MobileBar({
  meta,
  eid,
  onOpenAccountSheet,
}: {
  meta: HeaderMeta | null;
  eid: string | undefined;
  onOpenAccountSheet: () => void;
}) {
  const { data: me } = useMe();

  if (!meta) return null;
  const backHref = meta.variant === 'detail' ? meta.backHref : null;
  const action = meta.variant === 'list' ? meta.action : null;

  return (
    <div className="sticky top-0 z-30 flex h-[var(--shell-header-h)] items-center gap-3 border-b border-line-soft bg-surface px-4 md:hidden">
      {backHref && (
        <Link href={backHref} aria-label="이전으로" className={BACK_BUTTON_CLASS}>
          ←
        </Link>
      )}
      <div className="min-w-0 flex-1 truncate">
        {meta.variant === 'list' ? (
          <span className="truncate text-sm font-semibold text-ink">{meta.title}</span>
        ) : (
          <>
            <p className="eyebrow truncate">{meta.eyebrow}</p>
            {eid && (
              <EventHeaderData eid={eid}>
                {(event) => <p className="truncate text-sm font-semibold text-ink">{event?.name ?? ''}</p>}
              </EventHeaderData>
            )}
          </>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="min-h-touch shrink-0 inline-flex items-center rounded-[var(--radius-sharp)] bg-[var(--champagne)] px-[var(--space-11)] text-[length:var(--fs-cta)] font-bold text-[var(--btn-ink)]"
        >
          {action.label}
        </Link>
      )}
      <button
        type="button"
        aria-label="계정"
        onClick={onOpenAccountSheet}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-[var(--card)] text-sm font-semibold text-[var(--champagne)]"
      >
        {initialOf(me?.user?.username)}
      </button>
    </div>
  );
}

export function ShellHeader({ meta, eid, onOpenAccountSheet }: ShellHeaderProps) {
  return (
    <>
      <DesktopHeader meta={meta} eid={eid} />
      <MobileBar meta={meta} eid={eid} onOpenAccountSheet={onOpenAccountSheet} />
    </>
  );
}
