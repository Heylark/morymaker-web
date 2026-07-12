'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { parkDoneStorageKey } from '@/lib/visitor-storage';
import type { RecordRegisterResult } from '@/types/visitor';
import { AltLocationGuide } from './AltLocationGuide';
import { NoticeView } from './NoticeView';

interface ParkCompleteViewProps {
  slotCode: string;
}

/**
 * VIS-03 셀프 주차 완료 — 등록/승계 POST 응답을 재조회할 GET endpoint가 없어, 성공 직후
 * sessionStorage에 저장해둔 결과를 읽어 그대로 렌더한다(현장등록 완료 화면과 동일한 정책이나,
 * 결과 타입이 강결합돼 있어 별도 컴포넌트로 분리해 그 화면을 오염시키지 않는다). 새로고침 등
 * 으로 세션이 사라지면 재등록을 유도한다(안전 처리).
 */
export function ParkCompleteView({ slotCode }: ParkCompleteViewProps) {
  const [result, setResult] = useState<RecordRegisterResult | null>();

  useEffect(() => {
    const raw = sessionStorage.getItem(parkDoneStorageKey(slotCode));
    // SSR에는 sessionStorage 자체가 없어 서버·클라 첫 렌더는 항상 undefined로 일치하고(아래
    // 얼리 리턴), 커밋 후 1회 갱신은 의도된 동작이다(현장등록 완료 화면과 동일 정책).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(raw ? (JSON.parse(raw) as RecordRegisterResult) : null);
  }, [slotCode]);

  // 브라우저 마운트 전(SSR 가드) — sessionStorage 판독 전까지는 아무것도 그리지 않는다(깜빡임 회피).
  if (result === undefined) return null;

  if (!result) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6">
        <NoticeView title="등록 정보를 찾을 수 없습니다" message="자리 QR을 다시 스캔해 등록해 주세요." />
        <Link
          href={`/p/${slotCode}`}
          className="min-h-touch flex items-center justify-center rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink"
        >
          다시 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 bg-surface p-6 text-center">
      <p
        className="text-[length:var(--fs-display)] font-normal leading-tight [font-family:var(--serif)] [filter:var(--glow-num)]"
        // background-clip을 Tailwind 유틸리티(bg-clip-text)로 분리하면 [background:...] shorthand가
        // 별도 규칙으로 생성되어 암묵적으로 background-clip을 border-box로 되돌린다(순서 무관 승리).
        // 같은 style 선언 하나에 background→background-clip→color를 순서대로 명시해 캐스케이드
        // 충돌을 원천 차단한다(shared/primitives.css .gold 클래스와 동일 원리).
        style={{ background: 'var(--gold-grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
      >
        {result.record.slotDisplay}
      </p>
      {result.message && <p className="text-desk text-ink-muted">{result.message}</p>}
      <AltLocationGuide variant="park" />
    </div>
  );
}
