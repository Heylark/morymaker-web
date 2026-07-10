'use client';

import { useZones } from '@/hooks/useZones';
import { ZoneForm } from './ZoneForm';
import { SlotTitleTable } from './SlotTitleTable';
import { SlotQrGrid } from './SlotQrGrid';

interface ZoneDetailClientProps {
  eid: string;
  zid: string;
}

const NEW_ZONE_PARAM = 'new';

/**
 * 구획 상세(생성/편집) 오케스트레이터 — `zid==='new'`는 생성 폼, 그 외는 목록에서 구획을 찾아
 * 편집 폼 + 자리 타이틀 테이블 + QR 그리드를 함께 보여준다(단건 GET endpoint가 없어 목록에서 find).
 */
export function ZoneDetailClient({ eid, zid }: ZoneDetailClientProps) {
  const isNew = zid === NEW_ZONE_PARAM;
  const { data: zones } = useZones(eid);
  const zone = !isNew ? (zones?.find((z) => z.id === zid) ?? null) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">{isNew ? '새 구획 추가' : '구획 편집'}</h1>

      {isNew && <ZoneForm eid={eid} />}

      {!isNew && !zone && <p className="text-ink-muted">구획을 불러오는 중이거나 존재하지 않습니다.</p>}

      {!isNew && zone && (
        <>
          <ZoneForm eid={eid} zone={zone} />
          {/* key에 slotCount를 포함 — 자리 개수가 바뀌면 편집 중 로컬 상태를 새 개수 기준으로 초기화 */}
          <SlotTitleTable key={`${zone.id}-${zone.slotCount}`} eid={eid} zone={zone} />
          <SlotQrGrid eid={eid} zone={zone} />
        </>
      )}
    </main>
  );
}
