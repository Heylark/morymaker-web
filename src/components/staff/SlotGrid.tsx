import Link from 'next/link';
import type { ParkingRecord } from '@/types/staff';
import { ReviewBadge } from './ReviewBadge';

interface SlotGridProps {
  records: ParkingRecord[];
}

const STATUS_STYLE: Record<string, string> = {
  주차중: 'border-state-active/40 bg-state-active/10',
  출차: 'border-black/10 bg-surface',
};

/** 자리 타일 그리드 — 각 타일이 자리 처리 화면으로 연결된다. 세그먼트 값은 기록 id다(등록된 자리만 목록에 나타난다). */
export function SlotGrid({ records }: SlotGridProps) {
  if (records.length === 0) {
    return <p className="text-ink-muted">표시할 자리 기록이 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {records.map((record) => (
        <Link
          key={record.id}
          href={`/staff/parking-board/${record.id}`}
          className={`flex min-h-touch flex-col gap-1 rounded-card border p-3 ${STATUS_STYLE[record.status] ?? 'border-black/10 bg-surface'}`}
        >
          <span className="text-desk font-semibold text-ink">{record.slotDisplay}</span>
          <span className="text-sm text-ink-muted">{record.plate}</span>
          {record.reviewNeeded && <ReviewBadge />}
        </Link>
      ))}
    </div>
  );
}
