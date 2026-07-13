'use client';

import { useState } from 'react';
import { SeatGroupList } from './SeatGroupList';
import type { SeatGroupResponse } from '@/types/seat';

interface SeatsClientProps {
  eid: string;
}

/**
 * ADM-06 좌석 구성 — 최상위 `<div>`(`EventConsoleShell`이 이미 `<main>`을 보유하고 있어 여기서
 * 또 `<main>`을 두면 랜드마크가 중복된다 — RosterClient/ZoneList와 동일한 관용구).
 *
 * 배정 편집(`SeatAssignModal`)은 다음 Developer 단계 구현 대상이다. 여기서는 선택 그룹 state만
 * 준비해두고(그룹 목록의 "배정" 버튼은 이미 동작), 실제 편집 화면 자리는 준비 중 안내로
 * 대체한다 — 다음 단계에서 이 안내 블록을 `SeatAssignModal`로 그대로 교체하면 된다.
 */
export function SeatsClient({ eid }: SeatsClientProps) {
  const [assigningGroup, setAssigningGroup] = useState<SeatGroupResponse | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">좌석 구성</h1>
      <SeatGroupList eid={eid} onAssign={setAssigningGroup} />

      {assigningGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg">
            <h2 className="text-desk-lg font-semibold text-ink">{assigningGroup.label} 배정</h2>
            <p className="text-sm text-ink-muted">배정 편집 화면은 준비 중입니다.</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningGroup(null)}
                className="min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
