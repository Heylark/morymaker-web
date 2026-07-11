/**
 * 방문자 셀프 주차(VIS-01/03) sessionStorage 키 단일 정의 — 등록 폼(쓰기)과 완료 화면(읽기)
 * 양쪽이 이 헬퍼를 통해서만 키 문자열을 만든다. 두 파일이 각자 문자열을 하드코딩하면
 * 리팩터 중 한쪽만 바뀌어 조용히 어긋나는 정합 이탈 위험이 있다(현장등록 완료 화면의
 * 기존 방식은 이 위험을 안고 있으나, 이미 배포된 코드라 이번 REQ 범위에서 손대지 않는다).
 */
export function parkDoneStorageKey(slotCode: string): string {
  return `visitor:park-done:${slotCode}`;
}
