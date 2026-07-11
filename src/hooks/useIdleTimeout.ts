'use client';

import { useEffect, useRef } from 'react';

/**
 * 무동작 감지 얇은 훅 — pointerdown·keydown·touchstart 활동 시 타이머를 리셋하고, `ms` 동안
 * 무동작이면 `onTimeout()`을 호출한다. "언제" 타임아웃인지만 판단하고 "무엇을 초기화할지"는
 * 모른다 — 개인정보 초기화(reducer RESET·RQ 캐시 제거·세션 저장소 clear)는 호출부(페이지) 책임으로
 * 분리한다. DOM 이벤트에 의존해 jsdom 부재 환경(vitest node)에서는 단위 테스트 대상이 아니다
 * (CP-3 dev 서버 실측으로 검증).
 */
export function useIdleTimeout(onTimeout: () => void, ms: number): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // onTimeout이 매 렌더 새 함수여도 useEffect 재등록(리스너 재부착)을 유발하지 않도록 ref로 최신값만 추적한다.
  // ref 갱신은 렌더 중이 아니라 별도 effect에서 수행한다(react-hooks/refs — 렌더 중 ref 쓰기 금지).
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onTimeoutRef.current(), ms);
    }

    resetTimer();
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((event) => document.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [ms]);
}
