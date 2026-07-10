import type { ParkingRecord } from '@/types/staff';
import { ReviewBadge } from './ReviewBadge';

interface CheckoutPanelProps {
  record: ParkingRecord;
  onCheckout: () => void;
  onClearReview: () => void;
  checkoutPending: boolean;
  clearReviewPending: boolean;
}

/** 이미 등록된 자리의 출차·확인배지 해제 패널 (PRK-02). */
export function CheckoutPanel({
  record,
  onCheckout,
  onClearReview,
  checkoutPending,
  clearReviewPending,
}: CheckoutPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-desk font-semibold text-ink">{record.plate}</p>
      {record.vipName && <p className="text-sm text-ink-muted">성함: {record.vipName}</p>}
      <p className="text-sm text-ink-muted">상태: {record.status}</p>
      {record.reviewNeeded && <ReviewBadge />}

      {record.status === '주차중' && (
        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutPending}
          className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
        >
          {checkoutPending ? '처리 중...' : '출차 처리'}
        </button>
      )}
      {record.reviewNeeded && (
        <button
          type="button"
          onClick={onClearReview}
          disabled={clearReviewPending}
          className="min-h-touch rounded-card bg-state-review px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
        >
          {clearReviewPending ? '처리 중...' : '확인 완료 (배지 해제)'}
        </button>
      )}
    </div>
  );
}
