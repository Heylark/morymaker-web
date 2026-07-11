import type { KioskCheckinResult } from '@/types/kiosk';

interface SeatGuideProps {
  result: KioskCheckinResult;
}

/**
 * 좌석안내 — checkin 응답을 그대로 렌더한다(display 포맷은 화면마다 통일하지 않는다). 미배정자는
 * 안내데스크 문의로 안내. `resultCode`(ALREADY_CHECKED_IN)에 따라 헤더 문구만 분기한다.
 */
export function SeatGuide({ result }: SeatGuideProps) {
  const already = result.resultCode === 'ALREADY_CHECKED_IN';

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-desk-lg font-semibold text-ink">{already ? '참석 확인됨' : '체크인 완료'}</p>
      <p className="text-desk text-ink-muted">{result.guest.name}</p>

      {result.guest.seatLabel ? (
        <p className="text-desk-lg font-semibold text-ink">좌석 {result.guest.seatLabel}</p>
      ) : (
        <p className="text-desk text-ink-muted">좌석 미배정 — 안내데스크에 문의해 주세요.</p>
      )}

      {result.parking ? (
        <p className="text-desk-lg font-semibold text-ink">주차 {result.parking.display}</p>
      ) : (
        <p className="text-desk text-ink-muted">주차 등록 정보가 없습니다.</p>
      )}
    </div>
  );
}
