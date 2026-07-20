'use client';

import { useParams } from 'next/navigation';
import { useStaffEvent } from '@/hooks/useStaffEvent';
import { useParkingRecords } from '@/hooks/useParkingRecords';
import { useRegisterParking } from '@/hooks/useRegisterParking';
import { useCheckout } from '@/hooks/useCheckout';
import { useClearReview } from '@/hooks/useClearReview';
import { ParkForm } from '@/components/staff/ParkForm';
import { CheckoutPanel } from '@/components/staff/CheckoutPanel';
import { StaffApiError } from '@/lib/api/staff';

/** 보드에 없는 빈 자리를 새로 등록할 때 진입하는 특수 세그먼트 값 — 그 외 값은 기존 기록의 id다. */
const NEW_SLOT_PARAM = 'new';

const REGISTER_RESULT_LABEL: Record<string, string> = {
  PARKED: '등록 완료',
  SUPERSEDED: '승계 처리됨 — 확인 필요',
  RE_REGISTERED: '본인 재등록 — 위치 갱신',
};

/**
 * PRK-02 자리 처리 — 보드 타일 탭(기존 기록 id)과 "새 자리 등록"(`new`) 두 진입을 한 페이지가
 * 처리한다. 기존 기록 상세는 별도 단건 조회 endpoint가 없어 목록(parking-records)을 필터 없이
 * 불러와 id로 찾는다 — 보드는 주차중만 필터하지만 상세는 어떤 상태의 기록이든(출차 포함) 찾을 수
 * 있어야 하므로 필터 없이 조회한다(그래서 보드의 필터 캐시와는 별개 쿼리다).
 */
export default function ParkingSlotPage() {
  const params = useParams<{ slotCode: string }>();
  const slotCode = params.slotCode;
  const { eid } = useStaffEvent();
  const { data: records } = useParkingRecords(eid, {});
  const registerMutation = useRegisterParking(eid);
  const checkoutMutation = useCheckout(eid);
  const clearReviewMutation = useClearReview(eid);

  const isNew = slotCode === NEW_SLOT_PARAM;
  const record = !isNew ? (records?.find((r) => r.id === slotCode) ?? null) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">
        {isNew ? '자리 등록' : (record?.slotDisplay ?? '자리 처리')}
      </h1>

      {isNew && <ParkForm onSubmit={(values) => registerMutation.mutate(values)} pending={registerMutation.isPending} />}

      {!isNew && !record && <p className="text-ink-muted">기록을 불러오는 중이거나 존재하지 않는 자리입니다.</p>}

      {!isNew && record && (
        <CheckoutPanel
          record={record}
          onCheckout={() => checkoutMutation.mutate(record.id)}
          onClearReview={() => clearReviewMutation.mutate(record.id)}
          checkoutPending={checkoutMutation.isPending}
          clearReviewPending={clearReviewMutation.isPending}
        />
      )}

      {registerMutation.isError && (
        <p className="text-danger">
          {registerMutation.error instanceof StaffApiError && registerMutation.error.code === 'SLOT_OCCUPIED'
            ? '이미 사용 중인 자리입니다. 다시 확인해 주세요.'
            : '등록 중 오류가 발생했습니다.'}
        </p>
      )}
      {registerMutation.isSuccess && (
        <p className="text-success">
          {REGISTER_RESULT_LABEL[registerMutation.data.result] ?? registerMutation.data.message}
        </p>
      )}
      {checkoutMutation.isError && <p className="text-danger">출차 처리 중 오류가 발생했습니다.</p>}
      {clearReviewMutation.isError && <p className="text-danger">배지 해제 중 오류가 발생했습니다.</p>}
    </main>
  );
}
