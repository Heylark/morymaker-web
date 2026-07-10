import { proxyFetch } from '@/lib/proxy-fetch';
import type {
  CheckinRequest,
  CheckinResult,
  CheckoutResult,
  GuestPreview,
  LookupResult,
  ParkingRecord,
  RegisterParkingRequest,
  RegisterParkingResult,
  ReviewClearResult,
} from '@/types/staff';

/** api 공통 에러 포맷(`GlobalExceptionHandler` — `{ error: { code, message, field } }`). */
interface ApiErrorBody {
  error: { code: string; message: string; field?: string | null };
}

/**
 * 실행자 API 호출 실패를 코드(`SLOT_OCCUPIED` 등)와 함께 표준화한다 — 호출부가 메시지 문자열
 * 파싱이 아니라 `code`로 분기한다(예: PRK-02 동시 등록 409).
 */
export class StaffApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`실행자 API 요청 실패 (${status} ${code})`);
  }
}

/** 실패 응답 본문을 표준 에러 포맷으로 파싱해 던진다 — 본문이 그 형태가 아니어도 안전하게 처리한다. */
async function throwOnError(res: Response): Promise<never> {
  const body: ApiErrorBody | null = await res.json().catch(() => null);
  throw new StaffApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR');
}

// ── HLP-01 통합 조회 ────────────────────────────────────────────────────────

export async function lookup(eid: string, q: string): Promise<LookupResult> {
  const res = await proxyFetch(`api/events/${eid}/lookup?q=${encodeURIComponent(q)}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// ── PRK-01/02 주차 기록 ─────────────────────────────────────────────────────

export interface ParkingRecordFilters {
  zoneId?: string;
  status?: string;
  plateTail?: string;
  reviewNeeded?: boolean;
}

function buildParkingRecordQuery(filters: ParkingRecordFilters): string {
  const params = new URLSearchParams();
  if (filters.zoneId) params.set('zoneId', filters.zoneId);
  if (filters.status) params.set('status', filters.status);
  if (filters.plateTail) params.set('plateTail', filters.plateTail);
  if (filters.reviewNeeded !== undefined) params.set('reviewNeeded', String(filters.reviewNeeded));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listParkingRecords(
  eid: string,
  filters: ParkingRecordFilters = {},
): Promise<ParkingRecord[]> {
  const res = await proxyFetch(`api/events/${eid}/parking-records${buildParkingRecordQuery(filters)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: ParkingRecord[] } = await res.json();
  return body.data;
}

export async function registerParking(
  eid: string,
  request: RegisterParkingRequest,
): Promise<RegisterParkingResult> {
  const res = await proxyFetch(`api/events/${eid}/parking-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  // 409(SLOT_OCCUPIED)도 호출부가 code로 분기해야 하므로 여기서 삼키지 않고 그대로 throw한다.
  if (!res.ok) return throwOnError(res);
  const body: { data: RegisterParkingResult } = await res.json();
  return body.data;
}

export async function checkoutParking(eid: string, id: string): Promise<CheckoutResult> {
  const res = await proxyFetch(`api/events/${eid}/parking-records/${id}/checkout`, { method: 'POST' });
  if (!res.ok) return throwOnError(res);
  const body: { data: CheckoutResult } = await res.json();
  return body.data;
}

export async function clearReview(eid: string, id: string): Promise<ReviewClearResult> {
  const res = await proxyFetch(`api/events/${eid}/parking-records/${id}/review-clear`, { method: 'POST' });
  if (!res.ok) return throwOnError(res);
  const body: { data: ReviewClearResult } = await res.json();
  return body.data;
}

// ── SCN-00/01 스캔·체크인 ───────────────────────────────────────────────────

export async function scanPreview(eid: string, token: string): Promise<GuestPreview> {
  const res = await proxyFetch(`api/events/${eid}/checkin/scan/${encodeURIComponent(token)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestPreview } = await res.json();
  return body.data;
}

export async function checkin(eid: string, request: CheckinRequest): Promise<CheckinResult> {
  const res = await proxyFetch(`api/events/${eid}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: CheckinResult } = await res.json();
  return body.data;
}
