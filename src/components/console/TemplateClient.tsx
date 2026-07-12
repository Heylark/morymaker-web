'use client';

import { RosterTabs } from './RosterTabs';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';

interface TemplateClientProps {
  eid: string;
}

/** ADM-12 초대 문자 템플릿 — 최상위 `<div>`(셸이 이미 `<main>`을 보유 — 랜드마크 중복 방지, RosterClient와 동일 원칙). */
export function TemplateClient({ eid }: TemplateClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">초대 문자 템플릿</h1>
      <RosterTabs eid={eid} />
      <TemplateEditor eid={eid} />
      <TemplatePreview eid={eid} />
    </div>
  );
}
