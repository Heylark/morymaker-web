'use client';

import { ExcelUpload } from './ExcelUpload';
import { ConsoleModal } from './modal/ConsoleModal';

interface ExcelUploadModalProps {
  eid: string;
  onClose: () => void;
}

/**
 * 엑셀 명단 업로드를 `ConsoleModal`로 감싸는 얇은 래퍼 — 훅을 직접 호출하지 않고
 * `ExcelUpload`에 위임한다. 조건부 마운트(호출부에서 `{open && ...}`)로 쓰이므로 이 컴포넌트가
 * 열려 있는 동안은 항상 렌더된 상태이며, 닫히면 통째로 언마운트되어 파일 선택·미리보기 상태가
 * 자동으로 폐기된다 — close 시점에 별도 리셋을 호출할 필요가 없다.
 *
 * 확정 임포트가 성공하면 `ExcelUpload`가 `onConfirmSuccess`를 1회 호출하고, 그 신호를 그대로
 * `onClose`에 연결해 모달을 닫는다. 명단 표·발송 게이트 갱신은 확정 뮤테이션이 이미 수행하는
 * 캐시 무효화로 처리되므로 여기서 추가로 손댈 것이 없다.
 */
export function ExcelUploadModal({ eid, onClose }: ExcelUploadModalProps) {
  return (
    <ConsoleModal open onClose={onClose} title="엑셀 명단 업로드" size="lg">
      <ExcelUpload eid={eid} onConfirmSuccess={onClose} />
    </ConsoleModal>
  );
}
