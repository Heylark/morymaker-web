'use client';

import { useState } from 'react';
import { useStaffEvent } from '@/hooks/useStaffEvent';
import { useLookup } from '@/hooks/useLookup';
import { UnifiedSearch } from '@/components/staff/UnifiedSearch';
import { SearchStatusBadge } from '@/components/staff/SearchStatusBadge';

/**
 * HLP-01 통합 조회 — 이름∪차량번호 한 칸 검색. 1건은 목록 항목 자체가 이미 전체 상세를 포함해
 * 즉시상세로 수렴하고, 다건은 동일 목록에서 소속·차량으로 구분한다. 마스킹은 1차 미적용
 * (REQ 본문 명시) — API 응답을 그대로 노출한다.
 */
export default function StaffSearchPage() {
  const { eid } = useStaffEvent();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useLookup(eid, query);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">통합 조회</h1>
      <UnifiedSearch onSearch={setQuery} />

      {query.trim() === '' && <p className="text-ink-muted">이름 또는 차량번호를 입력하세요.</p>}
      {isLoading && <p className="text-ink-muted">검색 중...</p>}
      {isError && <p className="text-danger">조회 중 오류가 발생했습니다.</p>}

      {data && (
        <>
          <SearchStatusBadge searchState={data.meta.searchState} total={data.meta.total} />
          {data.data.length === 0 ? (
            <p className="text-ink-muted">일치하는 참석자가 없습니다. 현장 등록 여부를 확인하세요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.data.map((item) => (
                <li key={item.guestId} className="rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5">
                  <p className="text-desk font-semibold text-ink">
                    {item.name} <span className="text-sm font-normal text-ink-muted">{item.org ?? '-'}</span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    상태: {item.status}
                    {item.seatLabel ? ` · 좌석 ${item.seatLabel}` : ''}
                  </p>
                  {item.phone && <p className="text-sm text-ink-muted">연락처: {item.phone}</p>}
                  {item.plate && <p className="text-sm text-ink-muted">차량번호: {item.plate}</p>}
                  {item.parking && <p className="text-sm text-ink-muted">주차 위치: {item.parking.display}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
