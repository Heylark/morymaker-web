'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStaffEvent } from '@/hooks/useStaffEvent';
import { useParkingRecords } from '@/hooks/useParkingRecords';
import { ZoneFilter, type ZoneOption } from '@/components/staff/ZoneFilter';
import { SlotGrid } from '@/components/staff/SlotGrid';
import { PlateSearch } from '@/components/staff/PlateSearch';
import { deriveZoneLabel } from '@/lib/parking-zone-label';

/**
 * PRK-01 주차 보드 — 구획 선택기는 parking-zones API(관리자 전용이라 실행자 세션은 호출할 수
 * 없음)를 대신해 이미 로드한 parking-records 응답에서 zoneId·자리 번호를 파생한다. 구획·차량번호
 * 필터는 서버 재조회 없이 클라에서 좁힌다(이미 전체 목록을 들고 있어 왕복이 불필요).
 */
export default function ParkingBoardPage() {
  const { eid } = useStaffEvent();
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [plateTail, setPlateTail] = useState('');
  const { data: records, isLoading, isError } = useParkingRecords(eid, { status: '주차중' });

  const zones = useMemo<ZoneOption[]>(() => {
    if (!records) return [];
    const map = new Map<string, ZoneOption>();
    for (const record of records) {
      const existing = map.get(record.zoneId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(record.zoneId, { zoneId: record.zoneId, label: deriveZoneLabel(record.slotSig), count: 1 });
      }
    }
    return Array.from(map.values());
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter((record) => {
      if (zoneId && record.zoneId !== zoneId) return false;
      if (plateTail && !record.plate.endsWith(plateTail)) return false;
      return true;
    });
  }, [records, zoneId, plateTail]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">주차 보드</h1>
        <Link
          href="/staff/parking-board/new"
          prefetch={false}
          className="min-h-touch rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
        >
          새 자리 등록
        </Link>
      </div>

      <ZoneFilter zones={zones} selected={zoneId} onSelect={setZoneId} />
      <PlateSearch value={plateTail} onChange={setPlateTail} />

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">주차 기록을 불러오지 못했습니다.</p>}
      {records && <SlotGrid records={filtered} />}
    </main>
  );
}
