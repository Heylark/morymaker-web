'use client';

import { useState } from 'react';

/**
 * 기준점(baseline)과 현재 스냅샷을 비교해 dirty 여부를 반환한다. 기준점은 `open`이
 * false→true로 바뀌는 시점에 최신 스냅샷으로 갱신된다 — "항상 마운트된 채 open만 토글"하는
 * 소비처에서 마운트 시점 기준을 쓰면 페이지 최초 렌더(빈 값)가 기준점에 박제되어 무입력
 * 상태에서도 dirty=true가 되는 오탐이 생긴다. 그런 소비처는 이 훅 대신 각자의 폼 라이브러리가
 * 이미 제공하는 dirty 판정(react-hook-form `formState.isDirty` 등)을 쓴다.
 *
 * 조건부로 마운트되는 소비처(`SeatAssignEditor`)는 `open`에 상수 `true`를 넘긴다 — 마운트 =
 * 열림 시점이므로 첫 렌더에서 기준점이 그 스냅샷으로 즉시 고정되는 것이 정확한 의미론이다.
 *
 * 기준점 갱신은 ref가 아니라 "렌더 중 이전 값과 비교해 state를 조정"하는 React 공식 패턴을
 * 쓴다(https://react.dev/reference/react/useState#storing-information-from-previous-renders) —
 * 렌더 중 ref 읽기/쓰기는 React Compiler가 최적화를 포기시키는 대상이라 `useRef` 기반 구현은
 * 채택하지 않는다.
 */
export function useDirty(snapshot: string, open: boolean): boolean {
  const [baseline, setBaseline] = useState<string | null>(() => (open ? snapshot : null));
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setBaseline(snapshot);
  }

  if (!open || baseline === null) return false;
  return snapshot !== baseline;
}
