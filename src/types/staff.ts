/**
 * 실행자 웹(HLP·PRK·SCN) 응답 타입 — 실측 api DTO 미러(spec 예시 아님).
 *
 * checkin 응답만 문서 예시와 실제 필드가 달라 특히 주의한다: `resultCode`(문서 예시의 `result` 키
 * 아님) · `parking`은 guest 하위가 아니라 최상위 필드. 다른 계약(lookup·parking-record)은
 * 실측과 문서가 일치해 그대로 옮긴다.
 */

// ── HLP-01 통합 조회 (LookupResponse) ──────────────────────────────────────
export interface LookupParking {
  slotSig: string;
  display: string;
}

export interface LookupItem {
  guestId: string;
  name: string;
  org: string | null;
  title: string | null;
  status: string;
  seatLabel: string | null;
  phone: string | null;
  plate: string | null;
  parking: LookupParking | null;
}

export interface LookupMeta {
  total: number;
  // 'ONE' 외 값은 다건/없음 판정에 total과 병용한다 — 서버가 문자열 그대로 내려주므로 좁은 union으로
  // 제한하지 않고 실제 값(예: 'MANY', 'NONE')을 그대로 받는다.
  searchState: 'ONE' | string;
}

export interface LookupResult {
  items: LookupItem[];
  meta: LookupMeta;
}

// ── PRK 주차 기록 (RecordResponse) ─────────────────────────────────────────
export interface ParkingRecord {
  id: string;
  zoneId: string;
  slotSig: string;
  slotDisplay: string;
  plate: string;
  phone: string | null;
  vipName: string | null;
  guestId: string | null;
  registeredBy: string;
  registeredAt: string;
  status: string;
  reviewNeeded: boolean;
}

export interface ParkingMapping {
  matched: boolean;
  guestId: string | null;
  guestName: string | null;
  guestStatus: string | null;
}

export interface RegisterParkingResult {
  result: 'PARKED' | 'SUPERSEDED' | 'RE_REGISTERED';
  record: ParkingRecord;
  mapping: ParkingMapping;
  supersededRecord: ParkingRecord | null;
  message: string | null;
}

export interface RegisterParkingRequest {
  slotSig: string;
  zoneId: string;
  plate: string;
  phone?: string;
  vipName?: string;
  registeredBy: string;
}

// 출차·확인배지 해제는 전체 레코드가 아니라 변경된 필드만 담은 축약 응답을 돌려준다(실측 DTO).
export interface CheckoutResult {
  id: string;
  status: string;
}

export interface ReviewClearResult {
  id: string;
  reviewNeeded: boolean;
}

// ── SCN-00 스캔 프리뷰 (GuestResponse — 체크인 확정 전 조회 전용) ──────────
export interface GuestPreview {
  id: string;
  name: string;
  org: string | null;
  title: string | null;
  phone: string | null;
  plate: string | null;
  seatGroupId: string | null;
  seatLabel: string | null;
  status: string;
  src: string;
  visitAt: string | null;
  token: string;
  createdAt: string;
}

// ── SCN-01 체크인 (CheckinResponse — 실측 드리프트 지점) ───────────────────
export interface CheckinGuestView {
  id: string;
  name: string;
  org: string | null;
  status: string;
  visitAt: string | null;
  seatLabel: string | null;
}

export interface CheckinParkingView {
  slotSig: string;
  display: string;
}

export interface CheckinResult {
  // ⚠️ 문서 예시의 'result' 키가 아니라 실제 응답 필드명 'resultCode'를 따른다.
  resultCode: string; // 'CHECKED_IN' | 'ALREADY_CHECKED_IN'
  guest: CheckinGuestView;
  // ⚠️ guest 하위 중첩이 아니라 응답 최상위 필드다. guest.parking으로 접근하면 런타임 undefined.
  parking: CheckinParkingView | null;
}

export interface CheckinRequest {
  token?: string;
  guestId?: string;
}

// ── 행사 (Events — GET /api/events, 현재 행사 판정용) ──────────────────────
export interface EventSummary {
  id: string;
  name: string;
  eventDate: string | null;
  place: string | null;
  type: string | null;
  status: string;
  active: boolean;
}
