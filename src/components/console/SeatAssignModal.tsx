'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { StatePill } from '@/components/shared/StatePill';
import { useGuests } from '@/hooks/useGuests';
import { useSeatAssignments } from '@/hooks/useSeatAssignments';
import { useReplaceSeatAssignments } from '@/hooks/useReplaceSeatAssignments';
import { ConsoleApiError } from '@/lib/api/console-http';
import type { GuestResponse } from '@/types/guest';
import type { SeatAssignmentEntryRequest, SeatGroupResponse, SeatSlotResponse } from '@/types/seat';

interface SeatAssignModalProps {
  eid: string;
  group: SeatGroupResponse;
  onClose: () => void;
}

/** numbering ON 한 행 — ord(좌석 번호)는 배열 위치에서 파생하며, 사용자가 직접 입력하지 않는다. */
export interface AssignRow {
  rowId: string;
  guestId: string | null;
  guestName: string | null;
}

/** 서버 슬롯을 ord 순으로 정렬해 편집용 행으로 변환한다. rowId는 슬롯의 서버 id를 그대로 사용(안정적 React key). */
export function deriveOnRows(slots: SeatSlotResponse[]): AssignRow[] {
  return [...slots]
    .sort((a, b) => a.ord - b.ord)
    .map((slot) => ({ rowId: slot.id, guestId: slot.guestId, guestName: slot.guestName ?? null }));
}

/** 번호이동 — 위/아래 한 칸 교환. 경계를 벗어나면 원본을 그대로 반환한다(no-op). */
export function moveRow(rows: AssignRow[], index: number, direction: 'up' | 'down'): AssignRow[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= rows.length || target < 0 || target >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** 삽입 — newRowId는 호출부가 생성해 주입한다(순수 함수 유지, 테스트에서 고정 id로 검증 가능). */
export function insertEmptyRow(rows: AssignRow[], atIndex: number, newRowId: string): AssignRow[] {
  const next = [...rows];
  const clamped = Math.max(0, Math.min(atIndex, next.length));
  next.splice(clamped, 0, { rowId: newRowId, guestId: null, guestName: null });
  return next;
}

export function removeRow(rows: AssignRow[], index: number): AssignRow[] {
  return rows.filter((_, i) => i !== index);
}

export function setRowGuest(rows: AssignRow[], index: number, guestId: string | null, guestName: string | null): AssignRow[] {
  return rows.map((row, i) => (i === index ? { ...row, guestId, guestName } : row));
}

/** 저장 payload 변환 — 배열 위치가 곧 ord(index+1)이므로 서버의 "1..N 연속·유일" 검증이 구조적으로 항상 충족된다. */
export function toOnPayload(rows: AssignRow[]): SeatAssignmentEntryRequest[] {
  return rows.map((row, i) => ({ ord: i + 1, guestId: row.guestId }));
}

/** numbering OFF — 순서 무관 게스트 집합. 빈 좌석 개념이 없어 guestId가 있는 슬롯만 남긴다. */
export function deriveOffMemberIds(slots: SeatSlotResponse[]): string[] {
  return slots.filter((slot): slot is SeatSlotResponse & { guestId: string } => slot.guestId !== null).map((slot) => slot.guestId);
}

export function addMember(memberIds: string[], guestId: string): string[] {
  return memberIds.includes(guestId) ? memberIds : [...memberIds, guestId];
}

export function removeMember(memberIds: string[], guestId: string): string[] {
  return memberIds.filter((id) => id !== guestId);
}

/** ord는 서버가 무시하는 플레이스홀더 — numbering OFF는 위치 정보 자체가 의미 없다. */
export function toOffPayload(memberIds: string[]): SeatAssignmentEntryRequest[] {
  return memberIds.map((guestId, i) => ({ ord: i + 1, guestId }));
}

/**
 * 후보 명단 필터 — 이미 배정된(excludeIds) 게스트를 제외하고 이름/소속으로 검색한다.
 * "윈도잉"은 페이지 단위 서버 재조회가 아니라 이미 전체 로드된 후보 목록의 표시 필터링을
 * 뜻한다 — 저장은 그룹 배정 전체를 한 번에 교체하므로 payload를 페이지 단위로 나누면 미표시
 * 배정이 삭제되어 데이터가 손실되기 때문에 페이징 자체를 쓰지 않는다.
 */
export function filterCandidateGuests(allGuests: GuestResponse[], excludeIds: string[], query: string): GuestResponse[] {
  const excluded = new Set(excludeIds);
  const q = query.trim().toLowerCase();
  return allGuests.filter((guest) => {
    if (excluded.has(guest.id)) return false;
    if (!q) return true;
    return guest.name.toLowerCase().includes(q) || (guest.org ?? '').toLowerCase().includes(q);
  });
}

function conflictMessage(error: unknown): string {
  if (error instanceof ConsoleApiError && error.code === 'SEAT_CONFLICT') {
    return '이미 다른 그룹에 배정된 참석자가 있습니다. 해당 참석자를 확인해 주세요.';
  }
  return '저장하지 못했습니다. 배정을 확인해 주세요.';
}

interface SeatAssignEditorProps {
  eid: string;
  group: SeatGroupResponse;
  initialSlots: SeatSlotResponse[];
  candidates: GuestResponse[];
  onClose: () => void;
}

/**
 * `initialSlots`/`candidates`가 로드된 뒤에만 마운트된다(부모 SeatAssignModal의 조건부 렌더 —
 * 데이터가 없는 상태에서 로컬 state를 초기화하는 useEffect 동기화를 피하기 위한 게이트).
 * 마운트 시점 1회 lazy 초기화로 편집 세션을 시작하고, 저장 성공 시 onClose로 전체 모달이
 * 언마운트되므로 배경 refetch로 인한 stale 동기화 문제가 없다.
 */
function SeatAssignEditor({ eid, group, initialSlots, candidates, onClose }: SeatAssignEditorProps) {
  const [rows, setRows] = useState<AssignRow[]>(() => deriveOnRows(initialSlots));
  const [memberIds, setMemberIds] = useState<string[]>(() => deriveOffMemberIds(initialSlots));
  const [query, setQuery] = useState('');
  const replaceMutation = useReplaceSeatAssignments(eid);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const slot of initialSlots) if (slot.guestId && slot.guestName) map.set(slot.guestId, slot.guestName);
    for (const guest of candidates) map.set(guest.id, guest.name);
    return map;
  }, [initialSlots, candidates]);

  const handleSave = () => {
    const assignments = group.numbering ? toOnPayload(rows) : toOffPayload(memberIds);
    replaceMutation.mutate({ groupNo: group.groupNo, assignments }, { onSuccess: () => onClose() });
  };

  return (
    <>
      <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
        {group.numbering ? (
          <OnModeEditor rows={rows} setRows={setRows} candidates={candidates} />
        ) : (
          <OffModeEditor
            eid={eid}
            memberIds={memberIds}
            setMemberIds={setMemberIds}
            candidates={candidates}
            nameById={nameById}
            query={query}
            setQuery={setQuery}
          />
        )}
      </div>

      {replaceMutation.isError && <p className="text-sm text-danger">{conflictMessage(replaceMutation.error)}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onClose} disabled={replaceMutation.isPending}>
          취소
        </Button>
        <Button variant="gold" type="button" onClick={handleSave} disabled={replaceMutation.isPending}>
          {replaceMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </>
  );
}

interface OnModeEditorProps {
  rows: AssignRow[];
  setRows: (updater: (prev: AssignRow[]) => AssignRow[]) => void;
  candidates: GuestResponse[];
}

/** numbering ON — 순서 있는 좌석 행 배열. ord는 행 위치에서 파생되어 자유 입력 필드로 노출하지 않는다. */
function OnModeEditor({ rows, setRows, candidates }: OnModeEditorProps) {
  const appendRow = () => setRows((prev) => insertEmptyRow(prev, prev.length, crypto.randomUUID()));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">등록된 좌석이 없습니다.</p>
        <Button variant="ghost" type="button" onClick={appendRow}>
          좌석 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const usedElsewhere = rows.filter((_, i) => i !== index).map((r) => r.guestId).filter((id): id is string => id !== null);
        const options = filterCandidateGuests(candidates, usedElsewhere, '');
        const currentKnown = row.guestId !== null && options.some((c) => c.id === row.guestId);

        return (
          <div
            key={row.rowId}
            className="flex flex-col gap-2 rounded-card border border-line-soft bg-surface p-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="w-10 shrink-0 text-sm font-semibold text-ink-muted">{index + 1}번</span>
            <select
              value={row.guestId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setRows((prev) => setRowGuest(prev, index, null, null));
                  return;
                }
                const guest = candidates.find((c) => c.id === value);
                setRows((prev) => setRowGuest(prev, index, value, guest?.name ?? null));
              }}
              className="min-h-touch flex-1 rounded-card border border-line px-4 text-desk"
            >
              <option value="">(빈 좌석)</option>
              {row.guestId !== null && !currentKnown && (
                <option value={row.guestId}>{row.guestName ?? '알 수 없음'}</option>
              )}
              {options.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" type="button" onClick={() => setRows((prev) => moveRow(prev, index, 'up'))} disabled={index === 0}>
                위
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setRows((prev) => moveRow(prev, index, 'down'))}
                disabled={index === rows.length - 1}
              >
                아래
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setRows((prev) => insertEmptyRow(prev, index + 1, crypto.randomUUID()))}
              >
                삽입
              </Button>
              <Button variant="ghost" type="button" onClick={() => setRows((prev) => removeRow(prev, index))}>
                삭제
              </Button>
            </div>
          </div>
        );
      })}
      <Button variant="ghost" type="button" onClick={appendRow}>
        좌석 추가
      </Button>
    </div>
  );
}

interface OffModeEditorProps {
  eid: string;
  memberIds: string[];
  setMemberIds: (updater: (prev: string[]) => string[]) => void;
  candidates: GuestResponse[];
  nameById: Map<string, string>;
  query: string;
  setQuery: (q: string) => void;
}

/** numbering OFF — 순서 무관 게스트 집합. 배정된 명단 + 후보 검색/추가 두 섹션으로 구성. */
function OffModeEditor({ memberIds, setMemberIds, candidates, nameById, query, setQuery }: OffModeEditorProps) {
  const results = filterCandidateGuests(candidates, memberIds, query);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">배정된 참석자 ({memberIds.length}명)</span>
        {memberIds.length === 0 && <p className="text-sm text-ink-muted">배정된 참석자가 없습니다.</p>}
        {memberIds.length > 0 && (
          <ul className="flex flex-col gap-1">
            {memberIds.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-card border border-line-soft bg-surface p-3">
                <span className="text-desk text-ink">{nameById.get(id) ?? '알 수 없음'}</span>
                <Button variant="ghost" type="button" onClick={() => setMemberIds((prev) => removeMember(prev, id))}>
                  제거
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">참석자 검색 후 추가</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 또는 소속"
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          />
        </label>
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {results.length === 0 && <p className="text-sm text-ink-muted">검색 결과가 없습니다.</p>}
          {results.map((guest) => (
            <li key={guest.id} className="flex items-center justify-between gap-3 rounded-card border border-line-soft bg-surface p-3">
              <span className="text-desk text-ink">{guest.name}</span>
              <Button variant="ghost" type="button" onClick={() => setMemberIds((prev) => addMember(prev, guest.id))}>
                추가
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * 배정 편집 모달 — GuestEditModal 셸을 그대로 미러링한다(fixed inset-0 ... bg-black/40 +
 * rounded-card border-line-soft bg-surface). 폼이 아니라 행 이동·선택 인터랙션이라
 * react-hook-form 대신 로컬 state로 편집한다. 부모(SeatsClient)가 `assigningGroup`으로 조건부
 * 마운트하므로 `open` prop은 받지 않는다.
 */
export function SeatAssignModal({ eid, group, onClose }: SeatAssignModalProps) {
  const assignmentsQuery = useSeatAssignments(eid, group.groupNo);
  const guestsQuery = useGuests(eid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-desk-lg font-semibold text-ink">{group.label} 배정</h2>
          <StatePill tone={group.numbering ? 'done' : 'pending'}>{group.numbering ? '지정석' : '자유석'}</StatePill>
        </div>

        {(assignmentsQuery.isLoading || guestsQuery.isLoading) && <p className="text-ink-muted">불러오는 중...</p>}
        {(assignmentsQuery.isError || guestsQuery.isError) && (
          <p className="text-danger">배정 정보를 불러오지 못했습니다.</p>
        )}

        {assignmentsQuery.data && guestsQuery.data && (
          <SeatAssignEditor
            eid={eid}
            group={group}
            initialSlots={assignmentsQuery.data}
            candidates={guestsQuery.data.items}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
