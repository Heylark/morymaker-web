import { QRCodeSVG } from 'qrcode.react';
import { QrGlowBox } from '@/components/shared/QrGlowBox';

interface CheckinQrProps {
  url: string;
  size?: number;
}

/**
 * 체크인 QR 표시(공용 — VIS-00·VIS-02 공유). `url`은 서버가 조립한 절대 URL을 그대로
 * 인코딩한다 — web이 host·token을 재조립하면 로컬/운영 도메인이 어긋나 데스크 스캔이
 * 실패하므로 자체 조립을 하지 않는다. 공유 QrGlowBox(T1 호흡 발광)로 감싼다 — 이 컴포넌트가
 * 소비되는 화면(VIS-00·VIS-03 현장등록완료)의 유일한 발광 주체다.
 */
export function CheckinQr({ url, size = 200 }: CheckinQrProps) {
  return (
    <QrGlowBox glow hint="현장 데스크에서 스캔해 주세요">
      <QRCodeSVG value={url} size={size} />
    </QrGlowBox>
  );
}
