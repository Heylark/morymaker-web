'use client';

import Link from 'next/link';
import { useZones } from '@/hooks/useZones';

interface ZoneListProps {
  eid: string;
}

/** 구획 목록 — 각 행에서 상세(편집/자리 타이틀/QR)로 진입한다. */
export function ZoneList({ eid }: ZoneListProps) {
  const { data: zones, isLoading, isError } = useZones(eid);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
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
                className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-desk font-semibold text-ink">{zone.zoneName}</span>
                  <span className="text-sm text-ink-muted">{zone.slotCount}자리</span>
                </div>
                {/* zone.outdoor는 서버가 판정해 내려준 값 그대로 사용한다(프론트 재판정 금지) */}
                {zone.outdoor && (
                  <span className="inline-flex w-fit rounded-full bg-state-active/10 px-3 py-1 text-sm font-medium text-state-active">
                    야외
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
