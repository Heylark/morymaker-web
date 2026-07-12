import { CheckinQr } from './CheckinQr';

interface CheckinQrIssueProps {
  url: string;
}

/** 등록 직후 발급된 체크인 QR — 공용 CheckinQr을 등록 성공 맥락 문구로 감싼다(VIS-03 완료 화면에서 사용). */
export function CheckinQrIssue({ url }: CheckinQrIssueProps) {
  return (
    <div>
      <p className="mb-3.5 text-sm font-bold text-ink">체크인 QR이 발급되었습니다</p>
      <CheckinQr url={url} />
    </div>
  );
}
