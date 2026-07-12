/**
 * 관리자 콘솔 초대 문자(ADM-12) 응답/요청 타입 — 실측 api DTO 미러(spec 예시 아님).
 * 전 엔드포인트가 `{eid}` 루트(`/api/events/{eid}`) 하위 — SmsController가 GuestController와
 * 달리 별도 `/guests` 세그먼트를 갖지 않는다는 점에 유의(경로 조립 시 base 혼동 금지).
 */

// GET|PUT /api/events/{eid}/sms-template → {data: SmsTemplateResponse}
export interface SmsTemplateResponse {
  eventId: string;
  body: string;
  variables: string[]; // SmsRenderer.VARIABLES 서버 응답 — 하드코딩 금지(drift 방지)
  updatedAt: string | null; // 미설정 행사는 null(에러 아님 — "아직 작성 안 함")
}

export interface SmsTemplateUpdateRequest {
  body: string; // 필수(@NotBlank)
}

// POST /api/events/{eid}/sms-template/preview → {data: SmsPreviewResponse}
// gid 기준 — 이름 매칭 금지(동명이인 오발송 원천 차단).
export interface SmsPreviewRequest {
  guestId: string;
}

export interface SmsPreviewResponse {
  rendered: string; // 서버가 완성한 문자열 그대로 표시(클라 재조합 금지)
}

// POST /api/events/{eid}/sms/send/gate → {data: SmsGateResponse} (read-only 계산)
export interface SmsGateRequest {
  excludeAlreadySent: boolean; // 기본 true
}

export interface SmsGateResponse {
  candidates: number;
  blocked: SmsBlockedGuest[];
  alreadySent: number;
  canSend: boolean; // [발송] 버튼 활성 여부는 이 값에 직결(클라 재계산 금지)
  appliedTemplate: string;
}

export interface SmsBlockedGuest {
  guestId: string;
  name: string;
  missing: string[]; // 값 = "이름" / "전화번호"
}

// POST /api/events/{eid}/sms/send → {data: SmsSendResultResponse}
// confirm=true 필수 — 미충족 시 서버 예외. 서버가 내부적으로 게이트 재검증(!canSend면 차단).
export interface SmsSendRequest {
  excludeAlreadySent: boolean;
  confirm: boolean;
}

export interface SmsSendResultResponse {
  sent: number;
  failed: number;
  results: SmsSendItem[];
}

export interface SmsSendItem {
  guestId: string;
  phone: string | null;
  status: SmsLogStatus;
  smsLogId: string;
}

// POST /api/events/{eid}/sms/resend → {data: SmsSendItemResponse}
export interface SmsResendRequest {
  guestId: string;
  confirm: boolean;
}

// GET /api/events/{eid}/sms-log → {data: SmsLogResponse[]}
export interface SmsLogResponse {
  id: string;
  guestId: string | null; // 참석자 삭제돼도 이력은 보존(FK ON DELETE SET NULL)
  nameSnapshot: string | null;
  phone: string | null;
  sentAt: string;
  status: SmsLogStatus;
  bodySnapshot: string | null;
}

export type SmsLogStatus = '성공' | '실패' | '반송';
