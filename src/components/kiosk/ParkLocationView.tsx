import type { PublicParkingRecord } from '@/types/kiosk';

interface ParkLocationViewProps {
  record: PublicParkingRecord;
}

/** 주차위치안내 — 주차검색 선택 결과 재사용(재조회 없음), 자리명 큰 글씨. */
export function ParkLocationView({ record }: ParkLocationViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-desk text-ink-muted">{record.plate}</p>
      <p className="text-desk-lg font-semibold text-ink">{record.slotDisplay}</p>
    </div>
  );
}
