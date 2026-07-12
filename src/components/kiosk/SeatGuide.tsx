import type { KioskCheckinResult } from '@/types/kiosk';

interface SeatGuideProps {
  result: KioskCheckinResult;
}

/**
 * 좌석안내 — checkin 응답을 그대로 렌더한다(display 포맷은 화면마다 통일하지 않는다). 미배정자는
 * 안내데스크 문의로 안내. `resultCode`(ALREADY_CHECKED_IN)에 따라 헤더 문구만 분기한다.
 *
 * 좌석번호가 이 화면의 유일한 발광 주체(정적 존재 발광) — 세리프 대형 숫자를 골드 그라데이션으로
 * 각인하고 발광 필터를 적용한다. 나머지 텍스트(안내 문구·이름·주차 정보)는 발광 없이 절제한다.
 * 공유 `.num`(primitives.css)은 소형 무발광 인라인 각인 전용이라 규모가 달라 화면 로컬로 구현한다.
 */
export function SeatGuide({ result }: SeatGuideProps) {
  const already = result.resultCode === 'ALREADY_CHECKED_IN';

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <p className="text-desk text-ink-muted">{already ? '참석 확인됨' : '체크인 완료'}</p>
      <p className="text-desk-lg font-bold text-ink">{result.guest.name}</p>

      {result.guest.seatLabel ? (
        <>
          <p className="font-[var(--sans-lat)] text-[11px] uppercase tracking-[0.2em] text-[var(--faint)]">좌석</p>
          <p className="font-[var(--serif)] text-[length:var(--fs-num-lg)] leading-[1.04] bg-[image:var(--gold-grad)] bg-clip-text text-transparent [filter:var(--glow-num)]">
            {result.guest.seatLabel}
          </p>
        </>
      ) : (
        <p className="text-desk text-ink-muted">좌석 미배정 — 안내데스크에 문의해 주세요.</p>
      )}

      {result.parking ? (
        <p className="text-desk text-ink-muted">주차 {result.parking.display}</p>
      ) : (
        <p className="text-desk text-ink-muted">주차 등록 정보가 없습니다.</p>
      )}
    </div>
  );
}
