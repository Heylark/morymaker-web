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
 * 최상위 `<div>`(`ConsoleShell`이 이미 `<main>`을 보유하고 있어 여기서 또 `<main>`을 두면
 * 랜드마크가 중복되고 셸의 `p-6`과 겹쳐 여백이 두 배가 된다 — `RosterClient` 패턴을 그대로 따른다).
 */
export function ZoneDetailClient({ eid, zid }: ZoneDetailClientProps) {
  const isNew = zid === NEW_ZONE_PARAM;
  const { data: zones } = useZones(eid);
  const zone = !isNew ? (zones?.find((z) => z.id === zid) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
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
    </div>
  );
}
