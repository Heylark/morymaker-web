'use client';

import { useState } from 'react';
import { ConsoleButton } from './ConsoleButton';
import { RosterTabs } from './RosterTabs';
import { RosterTable } from './RosterTable';
import { ExcelUploadModal } from './ExcelUploadModal';
import { SendGateModal } from './SendGateModal';

interface RosterClientProps {
  eid: string;
}

/**
 * ADM-05 명단 관리 — 최상위 `<div>`(`ConsoleShell`이 이미 `<main>`을 보유하고 있어
 * 여기서 또 `<main>`을 두면 랜드마크가 중복된다 — 기존 `ZoneList`/`ZoneDetailClient`가 저지른
 * 실수의 재발 방지).
 *
 * 명단 표가 화면의 주 영역이 되도록 엑셀 업로드·초대 문자 발송을 상단 액션 버튼 2개로 옮기고
 * 각각을 모달 오버레이로 연다. 두 버튼 모두 진입 트리거는 `secondary`(테두리 affordance만, 골드
 * 채움 없음)다 — 실제 CTA(확정·발송)는 모달 안의 `primary`이고, 화면당 발광 예산은 1개이므로
 * 진입 버튼에는 골드(채움)를 쓰지 않는다.
 * 초대 문자 발송 버튼은 명단 건수와 무관하게 항상 활성 — 발송 가능 여부는 모달 안의 서버
 * 게이트(`useSmsGate`)가 유일하게 판정한다(클라이언트가 명단 수로 재판정하면 게이트가 두 곳에
 * 나뉘게 된다).
 */
export function RosterClient({ eid }: RosterClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">명단 관리</h1>
      <RosterTabs eid={eid} />
      <div className="flex flex-wrap gap-3">
        <ConsoleButton variant="secondary" type="button" onClick={() => setUploadOpen(true)}>
          엑셀 명단 업로드
        </ConsoleButton>
        <ConsoleButton variant="secondary" type="button" onClick={() => setSendOpen(true)}>
          초대 문자 발송
        </ConsoleButton>
      </div>
      <RosterTable eid={eid} />
      {uploadOpen && <ExcelUploadModal eid={eid} onClose={() => setUploadOpen(false)} />}
      {sendOpen && <SendGateModal eid={eid} onClose={() => setSendOpen(false)} />}
    </div>
  );
}
