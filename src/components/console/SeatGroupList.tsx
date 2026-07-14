'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { StatePill } from '@/components/shared/StatePill';
import { ConfirmDialog } from './ConfirmDialog';
import { SeatGroupForm } from './SeatGroupForm';
import { useSeatGroups } from '@/hooks/useSeatGroups';
import { useDeleteSeatGroup } from '@/hooks/useDeleteSeatGroup';
import type { SeatGroupResponse } from '@/types/seat';

interface SeatGroupListProps {
  eid: string;
  /** 배정 편집 진입 — SeatAssignModal은 다음 단계 구현 대상, 여기서는 선택 그룹만 상위로 알린다. */
  onAssign: (group: SeatGroupResponse) => void;
}

/**
 * 좌석 그룹 목록 — ZoneList/RosterTable 관용구를 계승하되, 그룹은 상세 페이지가 아니라
 * 모달(SeatGroupForm)로 편집한다(그룹 필드가 라벨+번호지정 토글 2개뿐이라 페이지 이동은
 * 과한 설계). 최상위 `<div>`(상위 SeatsClient가 이미 `<div flex-col gap-6>` — 여기서는
 * 섹션 컨테이너만 두고 `<main>`을 두지 않는다: 셸이 이미 `<main>`을 보유하므로 랜드마크 중복 방지).
 */
export function SeatGroupList({ eid, onAssign }: SeatGroupListProps) {
  const { data: groups, isLoading, isError } = useSeatGroups(eid);
  const deleteMutation = useDeleteSeatGroup(eid);
  const [editingGroup, setEditingGroup] = useState<SeatGroupResponse | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<SeatGroupResponse | null>(null);

  const openCreate = () => {
    setEditingGroup(undefined);
    setFormOpen(true);
  };
  const openEdit = (group: SeatGroupResponse) => {
    setEditingGroup(group);
    setFormOpen(true);
  };
  const closeForm = () => setFormOpen(false);

  const confirmDelete = async () => {
    if (!deletingGroup) return;
    await deleteMutation.mutateAsync({ gid: deletingGroup.id });
    setDeletingGroup(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-desk-lg font-semibold text-ink">좌석 그룹</h2>
        <Button variant="gold" type="button" onClick={openCreate}>
          그룹 추가
        </Button>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">그룹 목록을 불러오지 못했습니다.</p>}
      {groups && groups.length === 0 && <p className="text-ink-muted">등록된 좌석 그룹이 없습니다.</p>}

      {groups && groups.length > 0 && (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-desk font-semibold text-ink">{group.label}</span>
                  <StatePill tone={group.numbering ? 'done' : 'pending'}>
                    {group.numbering ? '지정석' : '자유석'}
                  </StatePill>
                </div>
                <span className="text-sm text-ink-muted">
                  배정 {group.assignedCount}명{group.slotCount !== undefined ? ` / 좌석 ${group.slotCount}석` : ''}
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={() => onAssign(group)}>
                  배정
                </Button>
                <Button variant="ghost" type="button" onClick={() => openEdit(group)}>
                  편집
                </Button>
                <Button variant="ghost" type="button" onClick={() => setDeletingGroup(group)}>
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SeatGroupForm eid={eid} open={formOpen} group={editingGroup} onClose={closeForm} />
      <ConfirmDialog
        open={deletingGroup !== null}
        title="좌석 그룹 삭제"
        message={`"${deletingGroup?.label ?? ''}" 그룹을 삭제하면 배정된 좌석도 함께 제거됩니다. 계속할까요?`}
        confirmLabel="삭제"
        danger
        pending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingGroup(null)}
      />
    </div>
  );
}
