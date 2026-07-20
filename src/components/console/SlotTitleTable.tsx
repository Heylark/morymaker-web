'use client';

import { useState } from 'react';
import { useUpdateZone } from '@/hooks/useUpdateZone';
import type { ZoneResponse } from '@/types/console';

interface SlotTitleTableProps {
  eid: string;
  zone: ZoneResponse;
}

/**
 * 부분 편집이어도 현재 전체 override 맵을 구축해 반환한다 — PUT titleOverrides는 delete-insert
 * 방식이라 부분 맵을 보내면 이번에 건드리지 않은 기존 override가 사라진다. 컴포넌트 렌더 없이
 * 단위 테스트하기 위해 순수 함수로 분리했다(SlotTitleTable.test.ts).
 */
export function buildFullOverrides(
  zone: Pick<ZoneResponse, 'startNo' | 'slotCount'>,
  titles: Record<string, string>,
): Record<string, string> {
  const fullOverrides: Record<string, string> = {};
  for (let i = 0; i < zone.slotCount; i++) {
    const key = String(zone.startNo + i);
    const val = (titles[key] ?? key).trim();
    if (val && val !== key) fullOverrides[key] = val;
  }
  return fullOverrides;
}

/**
 * 자리별 타이틀 개별 override 편집 — "일괄 저장" 버튼을 눌러야만 서버에 반영된다(즉시저장 아님).
 * 부모가 `key={zone.id}-${zone.slotCount}`로 이 컴포넌트를 remount하므로, slotCount가 바뀌면
 * 로컬 편집 상태가 새 자리 수 기준으로 다시 시드된다.
 */
export function SlotTitleTable({ eid, zone }: SlotTitleTableProps) {
  // 마운트 시점에 한 번만 서버 titleOverrides로 시드한다(함수형 초기화 — 매 렌더 재계산 아님).
  const [titles, setTitles] = useState<Record<string, string>>(() => zone.titleOverrides);
  const updateMutation = useUpdateZone(eid, zone.id);

  const slotNos = Array.from({ length: zone.slotCount }, (_, i) => zone.startNo + i);

  const handleSave = async () => {
    const fullOverrides = buildFullOverrides(zone, titles);
    const updated = await updateMutation.mutateAsync({
      part1: zone.part1 ?? '',
      part2: zone.part2,
      part3: zone.part3,
      part4: zone.part4,
      startNo: zone.startNo,
      slotCount: zone.slotCount,
      titleOverrides: fullOverrides,
    });
    // router.refresh() 대신 변이 반환값으로 로컬 상태를 동기화한다(stale useState 방지).
    setTitles(updated.titleOverrides);
  };

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line-soft bg-surface p-4">
      <h2 className="text-desk font-semibold text-ink">자리 타이틀</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="py-1 pr-4">번호</th>
            <th className="py-1">타이틀</th>
          </tr>
        </thead>
        <tbody>
          {slotNos.map((no) => {
            const key = String(no);
            return (
              <tr key={key}>
                <td className="py-1 pr-4 text-ink-muted">{no}</td>
                <td className="py-1">
                  <input
                    value={titles[key] ?? key}
                    onChange={(e) => setTitles((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="min-h-touch w-full rounded-card border border-line px-3 text-desk"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="min-h-touch w-fit rounded-card bg-primary px-4 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {updateMutation.isPending ? '저장 중...' : '타이틀 일괄 저장'}
      </button>
      {updateMutation.isSuccess && <p className="text-sm text-success">저장되었습니다.</p>}
      {updateMutation.isError && <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>}
    </section>
  );
}
