'use client';

import { useZoneQrZip } from '@/hooks/useZoneQrZip';

interface ZoneQrZipButtonProps {
  eid: string;
  zid: string;
  zoneName: string;
}

/** 인쇄용 QR 일괄 다운로드 — 서버가 생성한 zip을 소비만 한다(web은 생성하지 않음). */
export function ZoneQrZipButton({ eid, zid, zoneName }: ZoneQrZipButtonProps) {
  const { mutate, isPending, isError } = useZoneQrZip(eid);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => mutate({ zid, zoneName })}
        disabled={isPending}
        className="min-h-touch w-fit rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-ink disabled:opacity-50"
      >
        {isPending ? '다운로드 중...' : 'QR 일괄 다운로드'}
      </button>
      {isError && <p className="text-sm text-danger">다운로드에 실패했습니다. 로그인이 만료되었을 수 있어요.</p>}
    </div>
  );
}
