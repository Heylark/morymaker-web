'use client';

import { RosterTabs } from './RosterTabs';
import { RosterTable } from './RosterTable';
import { ExcelUpload } from './ExcelUpload';
import { SendGate } from './SendGate';
import { SmsLogView } from './SmsLogView';

interface RosterClientProps {
  eid: string;
}

/**
 * ADM-05 명단 관리 — 최상위 `<div>`(`ConsoleShell`이 이미 `<main>`을 보유하고 있어
 * 여기서 또 `<main>`을 두면 랜드마크가 중복된다 — 기존 `ZoneList`/`ZoneDetailClient`가 저지른
 * 실수의 재발 방지).
 */
export function RosterClient({ eid }: RosterClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">명단 관리</h1>
      <RosterTabs eid={eid} />
      <ExcelUpload eid={eid} />
      <RosterTable eid={eid} />
      <SendGate eid={eid} />
      <SmsLogView eid={eid} />
    </div>
  );
}
