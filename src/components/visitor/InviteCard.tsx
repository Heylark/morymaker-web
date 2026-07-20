import type { PublicHub } from '@/types/visitor';
import { StatePill } from '@/components/shared/StatePill';

interface InviteCardProps {
  hub: PublicHub;
}

/**
 * guest.status(서버 한글 리터럴 — 대기·방문·참석·취소, 좁은 union 아님) → StatePill 표시 톤 매핑.
 * 순수 프레젠테이션 매핑이며 데이터 계약·서버 판단에는 관여하지 않는다.
 */
function statusTone(status: string): 'pending' | 'done' | 'void' {
  if (status === '취소') return 'void';
  if (status === '방문' || status === '참석') return 'done';
  return 'pending';
}

/** 초대카드 — 본인 token으로 접근한 본인 데이터라 마스킹 불요, 이름을 큰 글씨로 표시한다(의전 사고 방지). */
export function InviteCard({ hub }: InviteCardProps) {
  const { guest, event } = hub;

  return (
    <div>
      <p className="mb-1.5 text-[length:var(--fs-label)] uppercase tracking-[var(--ls-eyebrow-wide)] text-primary">
        {event.name}
      </p>
      <p className="text-desk-lg font-extrabold text-ink">{guest.name}</p>
      {(guest.org || guest.title) && (
        <p className="mt-1 text-sm text-ink-muted">
          {guest.org}
          {guest.org && guest.title ? ' · ' : ''}
          {guest.title}
        </p>
      )}

      <div className="my-4 flex items-center gap-2.5" aria-hidden>
        <span className="h-px flex-1 bg-line-soft" />
        <span className="text-xs text-primary">◆</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <div className="grid gap-2.5">
        {guest.seatLabel && (
          <div className="flex items-baseline gap-3.5 text-sm">
            <span className="w-11 shrink-0 text-[length:var(--fs-label-sm)] uppercase tracking-[var(--ls-label)] text-[var(--faint)]">
              좌석
            </span>
            <span className="text-ink">{guest.seatLabel}</span>
          </div>
        )}
        {event.place && (
          <div className="flex items-baseline gap-3.5 text-sm">
            <span className="w-11 shrink-0 text-[length:var(--fs-label-sm)] uppercase tracking-[var(--ls-label)] text-[var(--faint)]">
              장소
            </span>
            <span className="text-ink">{event.place}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <StatePill tone={statusTone(guest.status)}>{guest.status}</StatePill>
      </div>
    </div>
  );
}
