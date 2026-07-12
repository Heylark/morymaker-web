import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type {
  GuestResponse,
  GuestCreateRequest,
  GuestUpdateRequest,
  GuestListResult,
  GuestSearchFilters,
  GuestImportPreviewResponse,
  GuestImportResultResponse,
} from '@/types/guest';

const guestsBase = (eid: string) => `api/events/${eid}/guests`;
// trailing slash 없음 — next.config에 trailingSlash 미설정(console.ts 패턴 계승).

/**
 * VIP 행사 특성상(참석자 수 통상 수백 이내) 페이지네이션 UI를 도입하지 않고 넉넉한 단일
 * size로 사실상 전체를 한 번에 로드한다(02-architect §5-1). 필터(q/status/src/includeCancelled)는
 * 항상 서버 파라미터로 전달 — searchState 3상태 계산이 서버 책임이라 클라 재필터는 금지.
 */
export const ROSTER_PAGE_SIZE = 500;

export async function listGuests(eid: string, filters: GuestSearchFilters = {}): Promise<GuestListResult> {
  const params = new URLSearchParams({ page: '1', size: String(ROSTER_PAGE_SIZE) });
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.src) params.set('src', filters.src);
  if (filters.includeCancelled) params.set('includeCancelled', 'true');

  const res = await proxyFetch(`${guestsBase(eid)}?${params.toString()}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse[]; meta?: { total?: number; searchState?: string; page?: number; size?: number } } =
    await res.json();
  return {
    items: body.data,
    total: body.meta?.total ?? body.data.length,
    searchState: (body.meta?.searchState as GuestListResult['searchState']) ?? null,
  };
}

export async function createGuest(eid: string, request: GuestCreateRequest): Promise<GuestResponse> {
  const res = await proxyFetch(guestsBase(eid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

export async function updateGuest(eid: string, gid: string, request: GuestUpdateRequest): Promise<GuestResponse> {
  const res = await proxyFetch(`${guestsBase(eid)}/${gid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

/**
 * 명단 제외(취소) — 하드 삭제 아님(status→취소 전이, 행 보존). `deleteSmsLog`는 항상 false로
 * 고정 전송한다(콘솔 UI가 이 파라미터를 토글로 노출하지 않음 — 이력 오삭제 방지 안전 기본값).
 */
export async function cancelGuest(eid: string, gid: string, deleteSmsLog = false): Promise<GuestResponse> {
  const res = await proxyFetch(`${guestsBase(eid)}/${gid}?deleteSmsLog=${deleteSmsLog}`, { method: 'DELETE' });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

export async function previewImport(eid: string, file: File): Promise<GuestImportPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type 헤더 직접 설정 금지 — 브라우저가 boundary 포함해 자동 설정(react.md §6).
  const res = await proxyFetch(`${guestsBase(eid)}/import/preview`, { method: 'POST', body: formData });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestImportPreviewResponse } = await res.json();
  return body.data;
}

/** confirmImport는 preview 토큰을 재사용하지 않고 파일을 다시 받아 재파싱한다 — 동일 File 재사용 필수. */
export async function confirmImport(eid: string, file: File): Promise<GuestImportResultResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await proxyFetch(`${guestsBase(eid)}/import`, { method: 'POST', body: formData });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestImportResultResponse } = await res.json();
  return body.data;
}
