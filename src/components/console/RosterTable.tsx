'use client';

import { useState } from 'react';
import { useGuests } from '@/hooks/useGuests';
import { useCancelGuest } from '@/hooks/useCancelGuest';
import { SearchStatusBadge } from './SearchStatusBadge';
import { GuestEditModal } from './GuestEditModal';
import { ConfirmDialog } from './ConfirmDialog';
import { StatePill } from '@/components/shared/StatePill';
import { GUEST_SRC_OPTIONS, GUEST_STATUS_OPTIONS, guestStatusTone, seatLabelDisplay } from '@/lib/console-constants';
import type { GuestResponse, GuestSrc, GuestStatus } from '@/types/guest';

interface RosterTableProps {
  eid: string;
}

/**
 * 명단 조회·필터·행 액션(수정/제외) — 검색·필터는 항상 서버 파라미터로 전달한다(searchState
 * 3상태 계산이 서버 책임, 클라 재필터 금지 — §5-1). 개별 등록은 이 테이블 헤더의 버튼이
 * `GuestEditModal`을 생성 모드(`guest` 없음)로 연다.
 */
export function RosterTable({ eid }: RosterTableProps) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<GuestStatus | ''>('');
  const [src, setSrc] = useState<GuestSrc | ''>('');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [editTarget, setEditTarget] = useState<GuestResponse | 'new' | null>(null);
  const [cancelTarget, setCancelTarget] = useState<GuestResponse | null>(null);

  const { data, isLoading, isError } = useGuests(eid, {
    q: q || undefined,
    status: status || undefined,
    src: src || undefined,
    includeCancelled,
  });
  const cancelMutation = useCancelGuest(eid);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    await cancelMutation.mutateAsync({ gid: cancelTarget.id });
    setCancelTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">이름·연락처 검색</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름 또는 연락처"
              className="min-h-touch rounded-card border border-line px-4 text-desk"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">상태</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GuestStatus | '')}
              className="min-h-touch rounded-card border border-line px-4 text-desk"
            >
              <option value="">전체</option>
              {GUEST_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">출처</span>
            <select
              value={src}
              onChange={(e) => setSrc(e.target.value as GuestSrc | '')}
              className="min-h-touch rounded-card border border-line px-4 text-desk"
            >
              <option value="">전체</option>
              {GUEST_SRC_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm text-ink-muted">제외 명단 포함</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* q 활성 + searchState 존재 시만 렌더(사실 B — q 없으면 meta.searchState 키 자체가 생략됨) */}
          {q && data?.searchState && <SearchStatusBadge searchState={data.searchState} total={data.total} />}
          <button
            type="button"
            onClick={() => setEditTarget('new')}
            className="min-h-touch rounded-card bg-primary px-4 text-sm font-semibold text-primary-ink"
          >
            개별 등록
          </button>
        </div>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">명단을 불러오지 못했습니다.</p>}
      {data && data.items.length === 0 && <p className="text-ink-muted">등록된 참석자가 없습니다.</p>}

      {data && data.items.length > 0 && (
        <>
          {/* 데스크톱(md 이상) — 기존 8열 표. 375px에서는 가로 스와이프가 강제돼 아래 카드형으로 대체 */}
          <div className="hidden overflow-x-auto rounded-card border border-line-soft bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line-soft text-ink-muted">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">소속/직함</th>
                  <th className="px-4 py-3 font-medium">연락처</th>
                  <th className="px-4 py-3 font-medium">차량번호</th>
                  <th className="px-4 py-3 font-medium">좌석</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">출처</th>
                  <th className="px-4 py-3 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((guest) => (
                  <tr key={guest.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">{guest.name}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {[guest.org, guest.title].filter(Boolean).join(' · ') || '-'}
                    </td>
                    {/* 비마스킹 기본값(CP-1 ③) — 원문 그대로 노출 */}
                    <td className="px-4 py-3 text-ink-muted">{guest.phone ?? '-'}</td>
                    <td className="px-4 py-3 text-ink-muted">{guest.plate ?? '-'}</td>
                    <td className="px-4 py-3 text-ink-muted">{seatLabelDisplay(guest.seatLabel)}</td>
                    <td className="px-4 py-3">
                      <StatePill tone={guestStatusTone(guest.status)}>{guest.status}</StatePill>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{guest.src}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setEditTarget(guest)} className="text-primary hover:underline">
                          수정
                        </button>
                        {guest.status !== '취소' && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(guest)}
                            className="text-danger hover:underline"
                          >
                            제외
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일(md 미만) — 참석자 1명당 카드 1개. 표와 같은 data.items·핸들러·StatePill 재사용(로직 중복 0) */}
          <ul aria-label="참석자 목록" className="flex flex-col gap-3 md:hidden">
            {data.items.map((guest) => (
              <li key={guest.id} className="rounded-card border border-line-soft bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{guest.name}</span>
                  <StatePill tone={guestStatusTone(guest.status)}>{guest.status}</StatePill>
                </div>
                <dl className="mt-3 flex flex-col text-sm">
                  {/* 연락처는 표와 동일하게 비마스킹 기본값(CP-1 ③) — 원문 그대로 노출 */}
                  {(
                    [
                      ['소속/직함', [guest.org, guest.title].filter(Boolean).join(' · ') || '-'],
                      ['연락처', guest.phone ?? '-'],
                      ['차량번호', guest.plate ?? '-'],
                      ['좌석', seatLabelDisplay(guest.seatLabel)],
                      ['출처', guest.src],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-line-soft py-2 last:border-0">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="min-w-0 text-right text-ink-muted">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex gap-4 border-t border-line-soft pt-3">
                  <button
                    type="button"
                    onClick={() => setEditTarget(guest)}
                    className="min-h-touch text-primary hover:underline"
                  >
                    수정
                  </button>
                  {guest.status !== '취소' && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(guest)}
                      className="min-h-touch text-danger hover:underline"
                    >
                      제외
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <GuestEditModal
        eid={eid}
        open={editTarget !== null}
        guest={editTarget !== 'new' && editTarget !== null ? editTarget : undefined}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="명단에서 제외"
        message={cancelTarget ? `"${cancelTarget.name}" 님을 명단에서 제외할까요? 발송 이력은 보존됩니다.` : ''}
        confirmLabel="제외"
        danger
        pending={cancelMutation.isPending}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
