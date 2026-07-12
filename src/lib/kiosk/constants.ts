/**
 * 키오스크 상수 단일화 — 하드코딩 금지(값 하나만 바꾸면 전체 반영).
 */

/** 무동작 60초 → idle 복귀 + 개인정보 state 일괄 초기화(모리메이커 확인 대상 — 값만 교체, 로직 무변). */
export const IDLE_TIMEOUT_MS = 60_000;

/** 이름검색 클라 게이트 — 2자 미만은 api가 400을 던지므로 요청 자체를 보내지 않는다. */
export const MIN_NAME_LENGTH = 2;

/** 차량 뒷자리 4자리 — api 검증(`^\d{4}$`)과 동일 패턴을 클라에서도 게이트한다. */
export const PLATE_TAIL_PATTERN = /^\d{4}$/;

/** React Query 쿼리키 접두 단일화 — RESET 시 `removeQueries({queryKey: kioskKeys.all})`로 PII 캐시 일괄 제거. */
export const kioskKeys = {
  all: ['kiosk'] as const,
  attendees: (eid: string, name: string) => [...kioskKeys.all, 'attendees', eid, name] as const,
  parking: (eid: string, plateTail: string) => [...kioskKeys.all, 'parking', eid, plateTail] as const,
  idle: (eid: string) => [...kioskKeys.all, 'idle', eid] as const,
};

/**
 * 무동작 타임아웃 시 개인정보 완전 초기화 3종 중 하나(reducer RESET·RQ 캐시 제거와 함께 —
 * 페이지 onTimeout 콜백이 셋을 함께 호출한다). 키오스크는 다수 방문자가 순환하는 공용 단말이라
 * 방문자 표면(`visitor-storage.ts` 등)의 개별 키 이름을 알 필요 없이 세션 저장소 전체를 지운다 —
 * 새 키가 추가돼도 자동으로 커버되어 이중 관리 위험이 없다. SSR·node 테스트 환경에서는 no-op.
 */
export function clearKioskSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.clear();
}
