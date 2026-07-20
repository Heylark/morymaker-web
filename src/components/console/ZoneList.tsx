'use client';

import Link from 'next/link';
import { useZones } from '@/hooks/useZones';
import { StatePill } from '@/components/shared/StatePill';

interface ZoneListProps {
  eid: string;
}

/**
 * 구획 목록 — 각 행에서 상세(편집/자리 타이틀/QR)로 진입한다. 최상위 `<div>`(`EventConsoleShell`이
 * 이미 `<main>`을 보유하고 있어 여기서 또 `<main>`을 두면 랜드마크가 중복되고 셸의 `p-6`과
 * 겹쳐 여백이 두 배가 된다 — `RosterClient` 패턴을 그대로 따른다).
 */
export function ZoneList({ eid }: ZoneListProps) {
  const { data: zones, isLoading, isError } = useZones(eid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">주차 구획</h1>
        <Link
          href={`/events/${eid}/parking/new`}
          className="min-h-touch rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
        >
          새 구획 추가
        </Link>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">구획 목록을 불러오지 못했습니다.</p>}
      {zones && zones.length === 0 && <p className="text-ink-muted">등록된 구획이 없습니다.</p>}

      {zones && zones.length > 0 && (
        <ul className="flex flex-col gap-3">
          {zones.map((zone) => (
            <li key={zone.id}>
              <Link
                href={`/events/${eid}/parking/${zone.id}`}
                className="flex items-center justify-between gap-3 rounded-card border border-line-soft bg-surface p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-desk font-semibold text-ink">{zone.zoneName}</span>
                  <span className="text-sm text-ink-muted">{zone.slotCount}자리</span>
                </div>
                {/* zone.outdoor는 서버가 판정해 내려준 값 그대로 사용한다(프론트 재판정 금지) */}
                {zone.outdoor && <StatePill tone="pending">야외</StatePill>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
