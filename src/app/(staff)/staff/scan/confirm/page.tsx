'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStaffEvent } from '@/hooks/useStaffEvent';
import { useScanPreview } from '@/hooks/useScanPreview';
import { useCheckin } from '@/hooks/useCheckin';
import { ScanPreviewCard } from '@/components/staff/ScanPreviewCard';
import { AttendConfirmCard } from '@/components/staff/AttendConfirmCard';

/**
 * SCN-01 본인 확인·참석 처리 — 두 진입 경로를 받는다: `token`(QR 스캔, 프리뷰 조회 가능)
 * `guestId`+`name`+`org`(이름검색 폴백 — 프리뷰 endpoint가 token 전용이라 검색 결과값을
 * 쿼리로 이어받아 그대로 표시한다). 어느 경로든 [참석 확인] 클릭 시 동일 체크인 endpoint를 호출한다.
 */
function ScanConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const guestId = searchParams.get('guestId');
  const nameParam = searchParams.get('name');
  const orgParam = searchParams.get('org');

  const { eid } = useStaffEvent();
  const { data: preview, isLoading: previewLoading } = useScanPreview(eid, token);
  const checkinMutation = useCheckin(eid);

  const displayName = preview?.name ?? nameParam ?? '';
  const displayOrg = preview?.org ?? orgParam ?? null;

  function handleConfirm() {
    if (token) {
      checkinMutation.mutate({ token });
    } else if (guestId) {
      checkinMutation.mutate({ guestId });
    }
  }

  if (!token && !guestId) {
    return <div className="text-ink-muted">잘못된 접근입니다 — 스캔 또는 검색을 다시 진행하세요.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {checkinMutation.isSuccess ? (
        <AttendConfirmCard result={checkinMutation.data} />
      ) : (
        <>
          {token && previewLoading && <p className="text-ink-muted">불러오는 중...</p>}
          <ScanPreviewCard name={displayName} org={displayOrg} seatLabel={preview?.seatLabel} />
          <button
            type="button"
            onClick={handleConfirm}
            disabled={checkinMutation.isPending}
            className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
          >
            {checkinMutation.isPending ? '처리 중...' : '참석 확인'}
          </button>
          {checkinMutation.isError && <p className="text-danger">체크인 처리 중 오류가 발생했습니다.</p>}
        </>
      )}
    </div>
  );
}

// useSearchParams는 정적 프리렌더 대상 페이지에서 Suspense 경계 없이 쓰면 next build가 실패한다
// (App Router 규칙) — 쿼리 파싱이 필요한 부분만 하위 컴포넌트로 분리해 감싼다.
export default function ScanConfirmPage() {
  return (
    <Suspense fallback={<div className="text-ink-muted">불러오는 중...</div>}>
      <ScanConfirmContent />
    </Suspense>
  );
}
