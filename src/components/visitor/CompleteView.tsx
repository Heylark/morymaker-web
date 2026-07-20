'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OnsiteRegisterResult } from '@/types/visitor';
import { AltLocationGuide } from './AltLocationGuide';
import { CheckinQrIssue } from './CheckinQrIssue';
import { NoticeView } from './NoticeView';

interface CompleteViewProps {
  eventCode: string;
}

function onsiteDoneStorageKey(eventCode: string): string {
  return `visitor:onsite-done:${eventCode}`;
}

/**
 * VIS-03 현장등록 완료 — 등록 POST 응답을 재조회할 GET endpoint가 없어, 등록 성공 직후
 * sessionStorage에 저장해둔 결과를 읽어 그대로 렌더한다. 직접 접근·새로고침 후
 * 세션 데이터가 지워진 경우는 재등록을 유도한다(안전 처리).
 */
export function CompleteView({ eventCode }: CompleteViewProps) {
  const [result, setResult] = useState<OnsiteRegisterResult | null>();

  useEffect(() => {
    const raw = sessionStorage.getItem(onsiteDoneStorageKey(eventCode));
    // sessionStorage는 구독 가능한 변경 이벤트가 없다(같은 탭 내 쓰기는 'storage' 이벤트 미발생) —
    // 마운트 시 1회 동기 판독 후 반영하는 것이 유일한 방법이다. SSR에는 sessionStorage 자체가
    // 없어 서버·클라 첫 렌더는 항상 undefined로 일치하고(위 얼리 리턴), 커밋 후 1회 갱신은 의도된 동작이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(raw ? (JSON.parse(raw) as OnsiteRegisterResult) : null);
  }, [eventCode]);

  // 브라우저 마운트 전(SSR 가드) — sessionStorage 판독 전까지는 아무것도 그리지 않는다(깜빡임 회피).
  if (result === undefined) return null;

  if (!result) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6">
        <NoticeView title="등록 정보를 찾을 수 없습니다" message="현장등록을 다시 진행해 주세요." />
        <Link
          href={`/r/${eventCode}`}
          className="min-h-touch flex items-center justify-center rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink"
        >
          현장등록으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6 text-center">
      <p className="text-desk-lg font-extrabold text-ink">{result.message}</p>
      <CheckinQrIssue url={result.checkinQr.url} />
      <AltLocationGuide />
    </div>
  );
}
