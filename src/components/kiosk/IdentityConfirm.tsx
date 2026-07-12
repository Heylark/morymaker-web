'use client';

import { useKioskCheckin } from '@/hooks/useKioskCheckin';
import { NoticeView } from '@/components/visitor/NoticeView';
import { KioskApiError } from '@/lib/api/kiosk';
import type { KioskCheckinResult, PublicAttendee } from '@/types/kiosk';

interface IdentityConfirmProps {
  eid: string;
  attendee: PublicAttendee;
  onConfirmed: (result: KioskCheckinResult) => void;
  onReject: () => void;
}

/**
 * 본인확인 — [맞아요]에서만 checkin POST 1회(호출부 계약, 중복 방지 — 서버 200 멱등이
 * 보조). [아니에요]는 REJECT_IDENTITY로 이름검색 복귀(BACK_TO_MENU가 아닌 전용 전이).
 */
export function IdentityConfirm({ eid, attendee, onConfirmed, onReject }: IdentityConfirmProps) {
  const mutation = useKioskCheckin(eid);
  const isRateLimited = mutation.error instanceof KioskApiError && mutation.error.status === 429;

  function handleConfirm() {
    mutation.mutate(attendee.guestId, { onSuccess: onConfirmed });
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-desk-lg font-semibold text-ink">{attendee.name}</p>
      {attendee.org && <p className="text-desk text-ink-muted">{attendee.org}</p>}
      <p className="text-desk text-ink-muted">본인이 맞으신가요?</p>

      <div className="flex w-full gap-4">
        <button
          type="button"
          onClick={onReject}
          disabled={mutation.isPending}
          className="min-h-touch flex-1 rounded-card bg-surface text-desk-lg font-semibold text-ink shadow-sm ring-1 ring-black/5 disabled:opacity-50"
        >
          아니에요
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={mutation.isPending}
          className="min-h-touch flex-1 rounded-card bg-primary text-desk-lg font-semibold text-primary-ink disabled:opacity-50"
        >
          {mutation.isPending ? '확인 중...' : '맞아요'}
        </button>
      </div>

      {isRateLimited && <NoticeView title="잠시 후 다시 시도해 주세요" />}
      {mutation.isError && !isRateLimited && <NoticeView title="처리 중 오류가 발생했습니다" />}
    </div>
  );
}
