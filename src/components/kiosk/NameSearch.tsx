'use client';

import { useState } from 'react';
import { useKioskNameSearch } from '@/hooks/useKioskNameSearch';
import { NoticeView } from '@/components/visitor/NoticeView';
import { KioskApiError } from '@/lib/api/kiosk';
import { MIN_NAME_LENGTH } from '@/lib/kiosk/constants';
import type { PublicAttendee } from '@/types/kiosk';

interface NameSearchProps {
  eid: string;
  onSelect: (attendee: PublicAttendee) => void;
}

/**
 * 이름검색 — 실시간 검색(별도 제출 버튼 없음), min 2자 클라 게이트. `meta.searchState`
 * 3상태(NONE/ONE/MANY, §0 실측 정정 — 이름검색만 meta 보유, 주차검색과 소스 비대칭이라 이 값을
 * 그대로 쓴다). 0건은 막다른 화면 없이 출구 문구를 보여준다(메뉴로/처음으로는 페이지 상단 nav 담당).
 */
export function NameSearch({ eid, onSelect }: NameSearchProps) {
  const [name, setName] = useState('');
  const { data, error, isFetching } = useKioskNameSearch(eid, name);
  const trimmed = name.trim();

  const isRateLimited = error instanceof KioskApiError && error.status === 429;
  // eid 사전 게이트 대신 최초 액션(이름검색)의 404를 무효 행사 안내로 대체한다.
  const isNotFound = error instanceof KioskApiError && error.status === 404;

  return (
    <div className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-desk text-ink-muted">성함을 입력해 주세요</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="min-h-touch rounded-card border border-black/10 bg-surface px-4 text-desk-lg text-ink"
        />
      </label>

      {trimmed.length > 0 && trimmed.length < MIN_NAME_LENGTH && (
        <p className="text-desk text-ink-muted">이름을 2자 이상 입력해 주세요.</p>
      )}

      {isFetching && <p className="text-desk text-ink-muted">검색 중...</p>}

      {isRateLimited && <NoticeView title="잠시 후 다시 시도해 주세요" />}

      {!isRateLimited && isNotFound && (
        <NoticeView title="행사를 찾을 수 없습니다" message="키오스크 관리자에게 문의해 주세요." />
      )}

      {!isRateLimited && !isNotFound && data?.searchState === 'NONE' && (
        <NoticeView title="명단에 없습니다" message="현장등록 또는 직원에게 문의해 주세요." />
      )}

      {!isRateLimited && !isNotFound && data && data.searchState !== 'NONE' && (
        <ul className="flex w-full flex-col gap-2">
          {data.attendees.map((attendee) => (
            <li key={attendee.guestId}>
              <button
                type="button"
                onClick={() => onSelect(attendee)}
                className="min-h-touch w-full rounded-card bg-surface px-4 text-left text-desk-lg text-ink shadow-sm ring-1 ring-black/5"
              >
                {attendee.name}
                {attendee.org && <span className="text-desk text-ink-muted"> · {attendee.org}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
