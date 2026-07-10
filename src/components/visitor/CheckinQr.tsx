import { QRCodeSVG } from 'qrcode.react';

interface CheckinQrProps {
  url: string;
  size?: number;
}

/**
 * 체크인 QR 표시(공용 — VIS-00·VIS-02 공유). `url`은 서버가 조립한 절대 URL을 그대로
 * 인코딩한다 — web이 host·token을 재조립하면 로컬/운영 도메인이 어긋나 데스크 스캔이
 * 실패하므로 자체 조립을 하지 않는다.
 */
export function CheckinQr({ url, size = 200 }: CheckinQrProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <QRCodeSVG value={url} size={size} />
      <p className="text-sm text-ink-muted">현장 데스크에서 스캔해 주세요</p>
    </div>
  );
}
