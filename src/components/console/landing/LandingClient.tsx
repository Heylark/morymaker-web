'use client';

import Link from 'next/link';
import { useMe } from '@/hooks/useMe';
import { useEvents } from '@/hooks/useEvents';
import { serviceNavItemsFor, type ServiceNavItem } from '@/lib/console-nav';
import { displayNameOf } from '@/lib/session-display';
import { SessionZone } from '@/components/console/shell/SessionZone';

const CARD_EYEBROW: Record<ServiceNavItem['key'], string> = {
  events: 'Events',
  accounts: 'Accounts',
  scan: 'On-site',
};

/**
 * 로그인 후 랜딩(다크 시그니처, `/landing`) — "누가 로그인했고 다음에 무엇을 할지"에만
 * 답한다. 이동 카드는 사이드바 Zone2와 동일 SSOT(`serviceNavItemsFor`)를 소비해 정의
 * 이원화를 피한다(ADR-005).
 *
 * 발광 예산 1개는 주 이동 카드(`items[0]`)에 둔다(ADR-014 — T3 채택). 핸드오프 정본 예시인
 * T2(진행 중 행사 숫자) 발광은 관리자 전용 데이터 의존이라 스태프 랜딩에서 발광이 0개가
 * 되어 채택하지 않는다 — 숫자 자체는(있으면) 발광 없이 함께 보여준다(핸드오프 각주 "CTA
 * 채택 시 숫자는 발광 없이 렌더" 그대로).
 *
 * 이동 카드가 0개(EVENT_STAFF 배정 0건·2건 이상)면 카드 대신 안내 문구를 렌더하고 발광도
 * 0이다(ADR-029 귀결 — §7 기준은 "카드가 1개 이상이면 발광 정확히 1, 0개면 발광 0").
 */
export function LandingClient() {
  const { data: me } = useMe();
  const username = me?.user?.username;
  const roles = me?.user?.roles ?? null;
  const eventIds = me?.user?.eventIds;

  const items = serviceNavItemsFor(roles, eventIds);
  const primaryKey = items[0]?.key;
  // 'events' 카드는 ADMIN_ROLES에게만 필터를 통과하므로, 이 카드의 존재 자체가 관리자
  // 세션임을 보장한다(§7 데이터 계약 — ADMIN_ROLES가 아니면 useEvents 호출 자체를 하지
  // 않아야 하는 조건과 동치).
  const showEventCount = items.some((item) => item.key === 'events');
  const { data: events } = useEvents({ enabled: showEventCount });
  const activeEventCount = events?.filter((event) => event.status !== '종료').length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line-soft px-[var(--space-20)] py-[var(--space-12)]">
        <Link href="/landing" className="flex items-center gap-2">
          <span className="font-[var(--serif)] text-lg text-[var(--champagne)]">M</span>
          <span className="text-sm font-semibold tracking-wide text-ink">MORYMAKER</span>
        </Link>
        <SessionZone variant="bar" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-[var(--space-5)] px-[var(--space-44)] py-[var(--space-30)]">
        <p className="eyebrow">Signed in</p>
        <h1 className="text-[length:var(--fs-subhead)] font-extrabold tracking-[var(--ls-tight)] text-ink">
          안녕하세요, {displayNameOf(username)}님
        </h1>
        <p className="text-[length:var(--fs-hint)] text-ink-muted">이동할 곳을 선택하세요.</p>

        {items.length === 0 ? (
          <p className="mt-[var(--space-14)] text-[length:var(--fs-body)] text-ink-muted">
            이용 가능한 메뉴가 없습니다 — 관리자에게 문의하세요.
          </p>
        ) : (
          <div className="mt-[var(--space-14)] grid grid-cols-1 gap-[var(--space-10)] sm:grid-cols-3">
            {items.map((item) => {
              const isPrimary = item.key === primaryKey;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex flex-col gap-[var(--space-3)] rounded-card bg-surface-sunken p-[var(--space-14)] transition-colors hover:border-[var(--champagne)] ${
                    isPrimary ? 'border border-line [box-shadow:var(--glow-cta)]' : 'border border-line-soft'
                  }`}
                >
                  <span className="eyebrow">{CARD_EYEBROW[item.key]}</span>
                  <span className="text-[length:var(--fs-body-sm)] font-bold text-ink">{item.label}</span>
                  {item.key === 'events' && showEventCount ? (
                    <span className="mt-[var(--space-5)] flex items-baseline gap-[var(--space-5)]">
                      <span className="font-[var(--serif)] text-[length:var(--fs-num-md)] leading-none text-[var(--champagne)]">
                        {activeEventCount}
                      </span>
                      <span className="text-[length:var(--fs-label)] text-ink-muted">건 운영·준비 중</span>
                    </span>
                  ) : (
                    <span className="text-[length:var(--fs-label)] leading-relaxed text-ink-muted">
                      {item.description}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
