/**
 * 관리자 콘솔 주차 구획(ADM-07) 응답/요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 성공 래퍼는 실행자(staff) 목록과 달리 `{data: T}` 단일 키(meta 없음). part1~4는 응답에서
 * nullable(String?)이나 요청에서 part1은 필수(@NotBlank) — 비대칭 그대로 반영.
 */

// GET /api/events/{eid}/parking-zones → {data: ZoneResponse[]}
export interface ZoneResponse {
  id: string;
  part1: string | null;
  part2: string | null;
  part3: string | null;
  part4: string | null;
  zoneName: string; // 서버 파생(part1~4 빈값제외 공백결합) — 프론트 재계산 금지
  outdoor: boolean; // 서버 파생(part1에 '야외' 포함) — 프론트 재판정 금지
  startNo: number;
  slotCount: number;
  titleOverrides: Record<string, string>; // 非null, 빈맵 기본. 키=slotNo 문자열, 값=override 타이틀
}

// POST → 201 {data: ZoneResponse}
export interface ZoneCreateRequest {
  part1: string; // 필수(@NotBlank) — 폼 클라측 required 강제
  part2?: string | null;
  part3?: string | null;
  part4?: string | null;
  startNo?: number; // 서버 기본 1
  slotCount: number; // @Min 1
}

// PUT /{zid} → 200 {data: ZoneResponse}
export interface ZoneUpdateRequest extends ZoneCreateRequest {
  // null/생략 = 타이틀 미변경 / 값·빈맵 = zone_id 기준 delete-insert(전삭제 후 재삽입)
  titleOverrides?: Record<string, string> | null;
}

// GET /{zid}/slots → {data: SlotForQrResponse[]}
export interface SlotForQrResponse {
  slotNo: number;
  slotCode: string; // 서버 조립(zid-slotIndex). web은 파싱·조립하지 않음
  slotFullName: string; // 서버 조립 표시명. SlotAutoLabel이 그대로 렌더
  scanUrl: string; // 서버 조립 절대 URL. QrPreview가 그대로 인코딩(자체 조립 금지)
}
