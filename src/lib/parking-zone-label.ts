/**
 * parking-records 응답의 slotSig(예 "지하 2층·A구역·3")에서 자리 번호(마지막 세그먼트)를 제거해
 * 구획 라벨을 파생한다. `GET /api/events/{eid}/parking-zones`가 EVENT_STAFF에 닫혀 있어(구획
 * 목록 조회는 관리자 전용 — CP-2 결정으로 web이 우회) 정식 구획명을 조회할 수 없는 대신 쓰는
 * 근사치다. slotSig가 `·` 구분자 포맷이라는 전제에 결합돼 있어(경미한 fragility), 구분자가
 * 없거나 세그먼트가 1개뿐이면 원문을 그대로 반환한다.
 */
export function deriveZoneLabel(slotSig: string): string {
  const segments = slotSig.split('·');
  if (segments.length <= 1) return slotSig;
  return segments.slice(0, -1).join('·');
}
