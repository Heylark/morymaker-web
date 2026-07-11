/**
 * 무인 키오스크 공개 표면(대기화면~주차위치안내) 응답 타입 — 실측 api DTO 미러(spec 예시 아님).
 *
 * 언어 혼재 주의: searchState·resultCode·mode은 영문 리터럴(서버 상수 그대로) / status·kind·play는
 * 한글 자유 텍스트 — 후자는 좁은 union으로 제한하지 않는다(types/visitor.ts `HubGuest.status` 선례
 * 정합). 이름검색과 주차검색은 meta 보유 여부가 다르다(이름검색만 meta{total,searchState}) —
 * 주차검색은 meta 없이 배열 길이로 3상태를 클라에서 계산한다.
 */

// ── 공통 래퍼 ────────────────────────────────────────────────────────────────

export interface ApiData<T> {
  data: T;
}

export interface KioskListResponse<T> {
  data: T[];
  meta?: KioskMeta;
}

export interface KioskMeta {
  total?: number;
  searchState?: string; // 'NONE' | 'ONE' | 'MANY' — 서버 상수 그대로, union 아님
  page?: number;
  size?: number;
}

export interface KioskApiErrorBody {
  error: { code: string; message: string; field?: string | null };
}

// ── 이름검색 (GET /api/public/events/{eid}/attendees) ────────────────────────

// 최소필드 — phone·plate·token 필드 자체가 응답에 없다(마스킹이 아니라 구조적 미노출).
export interface PublicAttendee {
  guestId: string;
  name: string;
  org: string | null;
  seatLabel: string | null;
  status: string; // 한글('참석'|'대기'…) — 서버 값 그대로
}

// ── 체크인 (POST /api/public/events/{eid}/checkin) ───────────────────────────

export interface KioskGuestView {
  name: string;
  org: string | null;
  status: string; // 한글
  seatLabel: string | null;
}

// '지하 2층 A구역 3' — checkin 응답 포맷('번' 없음). parking-search의 slotDisplay와 다른 포맷이며
// web은 임의로 통일하지 않는다(각 화면이 API 응답 그대로 렌더).
export interface KioskParkingView {
  display: string;
}

export interface KioskCheckinResult {
  resultCode: string; // 'CHECKED_IN' | 'ALREADY_CHECKED_IN' — 영문 고정값(안전 분기 허용)
  guest: KioskGuestView;
  parking: KioskParkingView | null;
}

// ── 주차검색 (GET /api/public/events/{eid}/parking-search) ───────────────────

export interface PublicParkingRecord {
  plate: string; // FULL 노출(마스킹 없음 — 다건 선택 UX 목적)
  slotDisplay: string; // '지하 2층 A구역 3번'('번' 접미) — checkin의 display와 다른 포맷
}

// ── 대기화면 (GET /api/public/events/{eid}/idle-contents) ────────────────────

export interface IdleContent {
  id: string;
  name: string;
  kind: string; // 한글('이미지'|'영상') — union 아님
  mode: string | null; // 'branded' | 'fullbleed' | null
  play: string | null; // 한글 자유 텍스트('자동재생'…) — union 절대 금지
  fileUrl: string | null; // 1차 항상 null(FileStoragePort 스텁 — 실 미디어 저장은 후속)
  sortOrder: number;
}

// 상태머신이 보유하는 정규화 타입(선택 결과 재사용용) — DTO alias
export type KioskAttendee = PublicAttendee;
export type KioskParkingRecord = PublicParkingRecord;
