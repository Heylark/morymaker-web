'use client';

import { SendGate } from './SendGate';
import { ConsoleModal } from './modal/ConsoleModal';

interface SendGateModalProps {
  eid: string;
  onClose: () => void;
}

/**
 * 초대 문자 발송 게이트를 `ConsoleModal`로 감싸는 얇은 래퍼 — 훅을 직접 호출하지 않고
 * `SendGate`에 위임한다. `SendGate`는 발송 확인 시 자체적으로 `ConfirmDialog`(내부적으로
 * `ConsoleModal`을 다시 사용)를 열므로, 발송 확인 중에는 모달이 2단으로 겹친다 — 발송 로직·
 * 확인 흐름은 그대로 두어 회귀 위험을 최소화하기 위한 선택이며, 발송 관련 상태·mutation은 이
 * 래퍼가 아니라 전부 `SendGate`가 소유한다.
 */
export function SendGateModal({ eid, onClose }: SendGateModalProps) {
  return (
    <ConsoleModal open onClose={onClose} title="초대 문자 발송" size="lg">
      <SendGate eid={eid} />
    </ConsoleModal>
  );
}
