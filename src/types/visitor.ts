/**
 * 방문자 공개 표면(VIS-00·02·03) 응답 타입 — 실측 api DTO 미러(spec 예시 아님).
 *
 * 공개 4개 엔드포인트는 성공 래퍼가 `{data: T}` 단일 키(meta 없음)로 실행자(staff) 목록
 * 응답과 다르다. status·src 값은 서버가 한글 문자열을 그대로 내려주므로 좁은 union으로
 * 제한하지 않는다(types/staff.ts `searchState` 선례 정합).
 */

// ── 공통 래퍼 ────────────────────────────────────────────────────────────────

export interface ApiData<T> {
  data: T;
}

// GlobalExceptionHandler ErrorBody에 @JsonInclude(NON_NULL)이 없어 field가 null이라도
// 키 자체는 존재할 수 있다 — 방어적으로 옵셔널 + null 허용.
export interface VisitorApiErrorBody {
  error: { code: string; message: string; field?: string | null };
}

// ── VIS-00 개인허브 (GET /api/public/u/{token}) ──────────────────────────────

export interface HubGuest {
  name: string;
  org: string | null;
  title: string | null;
  seatLabel: string | null;
  plate: string | null;
  status: string; // 한글 리터럴('대기'|'방문'|'참석'|'취소') — 서버 값 그대로, 좁은 union 아님
}

export interface HubEvent {
  name: string;
  place: string | null;
  eventDate: string | null; // Instant → Jackson ISO-8601 문자열
  bgColor: string | null;
  pointColor: string | null;
}

// url = 서버 조립 절대 URL(`{eventBaseUrl}/u/{token}`) — web은 그대로 인코딩(자체 조립 금지)
export interface HubCheckinQr {
  url: string;
  token: string;
}

export interface HubPrereg {
  plateRegistered: boolean;
  plate: string | null;
}

export interface HubParkingEntry {
  scanUrl: string;
}

export interface PublicHub {
  guest: HubGuest;
  event: HubEvent;
  checkinQr: HubCheckinQr;
  prereg: HubPrereg;
  parkingEntry: HubParkingEntry;
}

// POST /api/public/u/{token}/prereg-plate → 200 (전체 허브 재반환 안 함 — plate만 변경 필드)
export interface PreregResult {
  plate: string;
  message: string;
}

// ── VIS-02 현장등록 (GET /api/public/r/{eventCode}) ──────────────────────────

export interface OnsiteFormEvent {
  name: string;
  bgColor: string | null;
  pointColor: string | null;
}

// 허브 이벤트와 달리 place·eventDate 없음(실측 계약 — 허브와 다른 shape)
export interface OnsiteForm {
  event: OnsiteFormEvent;
}

// POST /api/public/r/{eventCode} → 201 Created
export interface OnsiteRegisterRequest {
  name: string;
  org?: string;
  phone?: string;
  plate?: string;
}

export interface OnsiteRegisterResult {
  guestId: string;
  token: string;
  checkinQr: HubCheckinQr;
  message: string;
}
