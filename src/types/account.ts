/**
 * 관리자 콘솔 계정·권한(ADM-11) 응답/요청 타입 — auth `AccountAdminResponse`·`AccountCreateRequest`·
 * `AccountUpdateRequest`·`AccountStatusRequest` 실측 미러(스펙 §3-2 JSON 예시 아님 — 스펙엔 없던
 * password가 실 계약엔 필수다).
 */

export type AccountRole = 'SYSTEM_ADMIN' | 'EVENT_ADMIN' | 'EVENT_STAFF';

// GET /api/accounts → {data: AccountResponse[], meta} (passwordHash 절대 미포함 — auth 계약)
export interface AccountResponse {
  id: string;
  email: string;
  name: string | null;
  role: AccountRole;
  status: string; // '활성' | '비활성' (auth Account STATUS_* — 한국어 리터럴. web은 재계산하지 않고 그대로 송·수신)
  eventIds: string[];
  note: string | null;
}

// POST /api/accounts → 201 {data: AccountResponse} (권한 SYSTEM_ADMIN)
export interface AccountCreateRequest {
  email: string;
  name?: string | null;
  role: AccountRole;
  eventIds: string[]; // SYSTEM_ADMIN이면 [] (서버 무시) / 그 외 역할은 ≥1(else 422)
  note?: string | null;
  password: string; // 관리자 직접 지정(서버 자동생성 아님) — @Size(min=8)
}

// PUT /api/accounts/{id} → {data: AccountResponse} (email·password 없음 — 서버 불변 필드)
export interface AccountUpdateRequest {
  name?: string | null;
  role: AccountRole;
  eventIds: string[];
  note?: string | null;
}

// PUT /api/accounts/{id}/status → {data: AccountResponse}
export interface AccountStatusRequest {
  status: string; // '활성' | '비활성'
}
