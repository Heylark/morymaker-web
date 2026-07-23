'use client';

import { RosterTabs } from './RosterTabs';
import { SmsLogView } from './SmsLogView';

interface HistoryClientProps {
  eid: string;
}

/** ADM-05 문자 발송 이력 — 최상위 `<div>`(셸이 이미 `<main>`을 보유 — 랜드마크 중복 방지, RosterClient·TemplateClient와 동일 원칙). */
export function HistoryClient({ eid }: HistoryClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">문자 발송 이력</h1>
      <RosterTabs eid={eid} />
      <SmsLogView eid={eid} />
    </div>
  );
}
