import type { PublicParkingRecord } from '@/types/kiosk';

interface ParkLocationViewProps {
  record: PublicParkingRecord;
}

/**
 * 주차위치안내 — 주차검색 선택 결과 재사용(재조회 없음). 자리명이 이 화면의 유일한 발광
 * 주체 — SeatGuide(KIO-04)에서 확정한 히어로 발광 숫자 문법을 그대로 재사용해 drift를
 * 방지한다(공유 primitive 승격 없이 동일 로컬 문법만 재사용).
 */
export function ParkLocationView({ record }: ParkLocationViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <p className="text-desk text-ink-muted">{record.plate}</p>
      <p className="font-[var(--serif)] text-[length:var(--fs-num-lg)] leading-[1.04] bg-[image:var(--gold-grad)] bg-clip-text text-transparent [filter:var(--glow-num)]">
        {record.slotDisplay}
      </p>
    </div>
  );
}
