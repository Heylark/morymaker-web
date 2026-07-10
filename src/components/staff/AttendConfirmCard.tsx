import type { CheckinResult } from '@/types/staff';

interface AttendConfirmCardProps {
  result: CheckinResult;
}

/** 체크인 확정 결과 카드 — resultCode(문서 예시 'result' 아님)로 분기, parking은 guest 하위가 아니라 최상위 필드(실측 API 응답 기준). */
export function AttendConfirmCard({ result }: AttendConfirmCardProps) {
  const isAlready = result.resultCode === 'ALREADY_CHECKED_IN';
  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className={`text-sm font-semibold ${isAlready ? 'text-state-review' : 'text-success'}`}>
        {isAlready ? '이미 체크인됨' : '참석 확인 완료'}
      </p>
      <p className="text-desk-lg font-semibold text-ink">{result.guest.name}</p>
      <p className="text-desk text-ink-muted">{result.guest.org ?? '-'}</p>
      {result.guest.seatLabel ? (
        <p className="text-desk text-ink">좌석: {result.guest.seatLabel}</p>
      ) : (
        <p className="text-sm text-ink-muted">좌석은 안내데스크 문의</p>
      )}
      {result.parking && <p className="text-desk text-ink">주차: {result.parking.display}</p>}
    </div>
  );
}
