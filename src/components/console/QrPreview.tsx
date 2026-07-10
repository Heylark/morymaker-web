import { QRCodeSVG } from 'qrcode.react';

interface QrPreviewProps {
  url: string; // 서버 조립 절대 URL — 그대로 인코딩(자체 조립 금지)
  size?: number;
  imageSettings?: React.ComponentProps<typeof QRCodeSVG>['imageSettings'];
}

/**
 * 자리 QR 미리보기(저수준 순수 표시) — `url`은 서버가 조립한 절대 URL(GET slots 응답 scanUrl)을
 * 그대로 인코딩한다. web이 host/slotCode를 재조립하면 로컬/운영 도메인이 어긋나 스캔이 실패하므로
 * 자체 조립을 하지 않는다(CheckinQr 동일 원칙). 브라우저 API·훅 미사용이라 'use client' 불요.
 */
export function QrPreview({ url, size = 160, imageSettings }: QrPreviewProps) {
  return <QRCodeSVG value={url} size={size} imageSettings={imageSettings} />;
}
