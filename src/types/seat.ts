/**
 * 관리자 콘솔 좌석 구성(ADM-06) 응답/요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 성공 래퍼는 `{data}` 단일 키. 단 배정 목록 조회만 `{data, meta}` — guests.ts와 동일 규약.
 */

// GET /api/events/{eid}/seat-groups → {data: SeatGroupResponse[]}
// PUT/DELETE /api/events/{eid}/seat-groups/{gid} → {data: SeatGroupResponse} (DELETE는 {data:{id}})
export interface SeatGroupResponse {
  id: string;
  groupNo: number;
  label: string;
  numbering: boolean;
  sortOrder: number;
  assignedCount: number;
  slotCount?: number; // numbering OFF면 서버가 키 자체를 생략(NON_NULL) — 표시 여부 판정에 사용
}

// POST /api/events/{eid}/seat-groups → 201 {data: SeatGroupResponse}
// groupNo·sortOrder는 서버 자동 채번/불변 — 요청에 포함하지 않는다.
export interface SeatGroupCreateRequest {
  label: string; // 필수(@NotBlank)
  numbering: boolean;
}

// PUT /api/events/{eid}/seat-groups/{gid} → {data: SeatGroupResponse}
export interface SeatGroupUpdateRequest {
  label: string;
  numbering: boolean;
}

// DELETE /api/events/{eid}/seat-groups/{gid} → {data: {id}}
export interface SeatGroupDeleteResponse {
  id: string;
}

// GET /api/events/{eid}/seat-assignments?groupNo= → {data: SeatSlotResponse[], meta:{total,page,size}}
export interface SeatSlotResponse {
  id: string;
  groupNo: number;
  ord: number;
  guestId: string | null;
  guestName?: string; // 값이 있을 때만 노출(NON_NULL)
  empty?: boolean; // 빈 좌석만 true(NON_NULL)
}

// 일괄 배정 항목 1건 — ord는 numbering OFF 그룹에서는 서버가 무시하고 9999로 강제한다.
export interface SeatAssignmentEntryRequest {
  ord: number;
  guestId: string | null;
}

// PUT /api/events/{eid}/seat-assignments → {data: SeatSlotResponse[]} (그룹 배정 세트 전체 원자 교체)
export interface SeatAssignmentBulkUpdateRequest {
  groupNo: number;
  assignments: SeatAssignmentEntryRequest[];
}
