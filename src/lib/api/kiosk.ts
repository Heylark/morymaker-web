import { proxyFetch } from '@/lib/proxy-fetch';
import type {
  IdleContent,
  KioskApiErrorBody,
  KioskCheckinResult,
  KioskListResponse,
  PublicAttendee,
  PublicParkingRecord,
} from '@/types/kiosk';

/**
 * 키오스크 공개 API 호출 실패를 코드와 함께 표준화한다(`VisitorApiError`·`StaffApiError` 미러)
 * — 호출부가 메시지 문자열 파싱이 아니라 `code`·`status`로 분기한다(예: 429 vs 404 구분).
 */
export class KioskApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`키오스크 API 요청 실패 (${status} ${code})`);
  }
}

/** 실패 응답 본문을 표준 에러 포맷으로 파싱해 던진다 — 본문이 그 형태가 아니어도 안전하게 처리한다. */
async function throwOnError(res: Response): Promise<never> {
  const body: KioskApiErrorBody | null = await res.json().catch(() => null);
  throw new KioskApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR');
}

export interface NameSearchResult {
  attendees: PublicAttendee[];
  searchState: string; // 'NONE' | 'ONE' | 'MANY'
  total: number;
}

// ── 이름검색 ──────────────────────────────────────────────────────────────

/**
 * 이름검색만 meta{total,searchState}를 함께 응답한다(§0 실측 정정 — 주차검색과 소스 비대칭).
 * 4xx(2자 미만·무효 eid·종료·rate limit)는 결정적이라 호출부가 재시도하지 않는다.
 */
export async function nameSearch(eid: string, name: string): Promise<NameSearchResult> {
  const res = await proxyFetch(`api/public/events/${eid}/attendees?name=${encodeURIComponent(name)}`);
  if (!res.ok) return throwOnError(res);
  const body: KioskListResponse<PublicAttendee> = await res.json();
  return {
    attendees: body.data,
    searchState: body.meta?.searchState ?? 'NONE',
    total: body.meta?.total ?? body.data.length,
  };
}

// ── 체크인 ────────────────────────────────────────────────────────────────

/** [맞아요] 확정 시 1회만 호출한다(호출부 계약) — 서버가 200 멱등(ALREADY_CHECKED_IN)이라 재호출도 안전하다. */
export async function checkin(eid: string, guestId: string): Promise<KioskCheckinResult> {
  const res = await proxyFetch(`api/public/events/${eid}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId }),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: KioskCheckinResult } = await res.json();
  return body.data;
}

// ── 주차검색 ──────────────────────────────────────────────────────────────

/** 주차검색은 meta가 없다(§0 실측 정정) — 3상태는 호출부(훅)가 배열 길이로 계산한다. */
export async function parkingSearch(eid: string, plateTail: string): Promise<PublicParkingRecord[]> {
  const res = await proxyFetch(`api/public/events/${eid}/parking-search?plateTail=${encodeURIComponent(plateTail)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: PublicParkingRecord[] } = await res.json();
  return body.data;
}

// ── 대기화면 ──────────────────────────────────────────────────────────────

/** fail-open — 무효 eid도 200 빈 배열로 응답한다(rate limit 없음). 에러 분기는 방어적으로만 유지한다. */
export async function idleContents(eid: string): Promise<IdleContent[]> {
  const res = await proxyFetch(`api/public/events/${eid}/idle-contents`);
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContent[] } = await res.json();
  return body.data;
}
