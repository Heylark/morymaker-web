'use client';

import { useStatsExcel } from '@/hooks/useStatsExcel';

interface StatsExcelButtonProps {
  eid: string;
}

/** 통계 Excel 일괄 다운로드 — 서버가 생성한 xlsx를 소비만 한다(web은 생성하지 않음). */
export function StatsExcelButton({ eid }: StatsExcelButtonProps) {
  const { mutate, isPending, isError } = useStatsExcel(eid);

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="min-h-touch w-fit rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-ink disabled:opacity-50"
      >
        {isPending ? '다운로드 중...' : '엑셀 다운로드'}
      </button>
      {isError && <p className="text-sm text-danger">다운로드에 실패했습니다. 로그인이 만료되었을 수 있어요.</p>}
    </div>
  );
}
