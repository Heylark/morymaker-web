import type { PublicHub } from '@/types/visitor';

interface InviteCardProps {
  hub: PublicHub;
}

/** 초대카드 — 본인 token으로 접근한 본인 데이터라 마스킹 불요, 이름을 큰 글씨로 표시한다(의전 사고 방지). */
export function InviteCard({ hub }: InviteCardProps) {
  const { guest, event } = hub;

  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-ink-muted">{event.name}</p>
      <p className="text-desk-lg font-semibold text-ink">{guest.name}</p>
      {(guest.org || guest.title) && (
        <p className="text-desk text-ink-muted">
          {guest.org}
          {guest.org && guest.title ? ' · ' : ''}
          {guest.title}
        </p>
      )}
      {guest.seatLabel && <p className="text-sm text-ink-muted">좌석: {guest.seatLabel}</p>}
      {event.place && <p className="text-sm text-ink-muted">장소: {event.place}</p>}
      <span className="w-fit rounded-full border border-black/10 bg-surface-sunken px-3 py-1 text-sm text-ink">
        {guest.status}
      </span>
    </div>
  );
}
