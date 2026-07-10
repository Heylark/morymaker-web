interface ScanPreviewCardProps {
  name: string;
  org: string | null;
  seatLabel?: string | null;
}

/** 체크인 확정 전 본인 확인 카드 — 이름·소속을 큰 글씨로 표시한다(의전 사고 방지). */
export function ScanPreviewCard({ name, org, seatLabel }: ScanPreviewCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-desk-lg font-semibold text-ink">{name}</p>
      <p className="text-desk text-ink-muted">{org ?? '-'}</p>
      {seatLabel && <p className="text-sm text-ink-muted">좌석: {seatLabel}</p>}
    </div>
  );
}
