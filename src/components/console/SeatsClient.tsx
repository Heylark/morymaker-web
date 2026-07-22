'use client';

import { useState } from 'react';
import { SeatGroupList } from './SeatGroupList';
import { SeatAssignModal } from './SeatAssignModal';
import type { SeatGroupResponse } from '@/types/seat';

interface SeatsClientProps {
  eid: string;
}

/**
 * ADM-06 좌석 구성 — 최상위 `<div>`(`ConsoleShell`이 이미 `<main>`을 보유하고 있어 여기서
 * 또 `<main>`을 두면 랜드마크가 중복된다 — RosterClient/ZoneList와 동일한 관용구).
 *
 * 배정 편집은 `SeatAssignModal`이 `assigningGroup`으로 조건부 마운트된다 — 그룹 목록의 "배정"
 * 버튼이 선택 그룹을 세팅하면 모달이 열리고, 저장 성공/취소 시 `onClose`가 state를 비워 닫는다.
 */
export function SeatsClient({ eid }: SeatsClientProps) {
  const [assigningGroup, setAssigningGroup] = useState<SeatGroupResponse | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-desk-lg font-semibold text-ink">좌석 구성</h1>
      <SeatGroupList eid={eid} onAssign={setAssigningGroup} />

      {assigningGroup && (
        <SeatAssignModal eid={eid} group={assigningGroup} onClose={() => setAssigningGroup(null)} />
      )}
    </div>
  );
}
