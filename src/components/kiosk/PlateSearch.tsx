'use client';

import { useState } from 'react';
import { useKioskParkingSearch } from '@/hooks/useKioskParkingSearch';
import { NoticeView } from '@/components/visitor/NoticeView';
import { KioskApiError } from '@/lib/api/kiosk';
import { PlatePad } from './PlatePad';
import type { PublicParkingRecord } from '@/types/kiosk';

interface PlateSearchProps {
  eid: string;
  onSelect: (record: PublicParkingRecord) => void;
}

/**
 * 주차검색 — 온스크린 숫자 키패드(PlatePad)로 4자리 입력, meta 없이 배열 길이로 3상태를
 * 계산한다(§0 실측 정정 — 이름검색과 소스 비대칭, `searchState` 필드는 이 화면엔 없다). plate는
 * FULL 노출 그대로(마스킹 미적용 — 다건 선택 UX 목적).
 */
export function PlateSearch({ eid, onSelect }: PlateSearchProps) {
  const [plateTail, setPlateTail] = useState('');
  const { data, error, isFetching } = useKioskParkingSearch(eid, plateTail);

  const isRateLimited = error instanceof KioskApiError && error.status === 429;
  // eid 사전 게이트 대신 최초 액션(주차검색)의 404를 무효 행사 안내로 대체한다.
  const isNotFound = error instanceof KioskApiError && error.status === 404;
  const isEventClosed = error instanceof KioskApiError && error.status === 409;
  // 위 세 분기 외 에러는 IdentityConfirm과 동일한 일반 안내로 흡수한다(무피드백 공백 방지).
  const isOtherError = Boolean(error) && !isRateLimited && !isNotFound && !isEventClosed;
  const searched = data !== undefined;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PlatePad onSubmit={setPlateTail} pending={isFetching} />

      {isRateLimited && <NoticeView title="잠시 후 다시 시도해 주세요" />}

      {!isRateLimited && isNotFound && (
        <NoticeView title="행사를 찾을 수 없습니다" message="키오스크 관리자에게 문의해 주세요." />
      )}

      {!isRateLimited && !isNotFound && isEventClosed && (
        <NoticeView title="종료된 행사입니다" message="키오스크 관리자에게 문의해 주세요." />
      )}

      {isOtherError && <NoticeView title="처리 중 오류가 발생했습니다" />}

      {!isRateLimited && !isNotFound && !isEventClosed && !isOtherError && searched && data.length === 0 && (
        <NoticeView title="등록된 차량이 없습니다" message="현장등록 또는 직원에게 문의해 주세요." />
      )}

      {!isRateLimited && !isNotFound && !isEventClosed && !isOtherError && searched && data.length > 0 && (
        <ul className="flex w-full flex-col gap-2">
          {data.map((record, index) => (
            <li key={`${record.plate}-${index}`}>
              <button
                type="button"
                onClick={() => onSelect(record)}
                className="min-h-touch w-full rounded-card bg-surface px-4 text-left text-desk-lg text-ink shadow-sm ring-1 ring-black/5"
              >
                {record.plate}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
