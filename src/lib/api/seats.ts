import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type {
  SeatGroupResponse,
  SeatGroupCreateRequest,
  SeatGroupUpdateRequest,
  SeatGroupDeleteResponse,
  SeatSlotResponse,
  SeatAssignmentBulkUpdateRequest,
} from '@/types/seat';

const seatGroupsBase = (eid: string) => `api/events/${eid}/seat-groups`;
const seatAssignmentsBase = (eid: string) => `api/events/${eid}/seat-assignments`;
// trailing slash 없음 — next.config에 trailingSlash 미설정(guests.ts 패턴 계승).

/**
 * 배정 교체(PUT)는 원자 교체(deleteByGroup + insertBatch)라 저장 시 그룹의 전체 배정 집합을
 * 항상 전송해야 한다(02-architect ADR-001-보강). 조회도 동일 크기로 전체를 로드해야 부분
 * 집합만 로컬에 쥔 채 저장했을 때 나머지가 삭제되는 사고를 막는다 — guests.ts ROSTER_PAGE_SIZE
 * 를 그대로 계승(VIP 행사 규모 상한 내 단일 페이지 전체 로드, 서버 기본 size=50에 의존 금지).
 */
export const SEAT_ASSIGN_PAGE_SIZE = 500;

export async function listSeatGroups(eid: string): Promise<SeatGroupResponse[]> {
  const res = await proxyFetch(seatGroupsBase(eid));
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatGroupResponse[] } = await res.json();
  return body.data;
}

export async function createSeatGroup(eid: string, request: SeatGroupCreateRequest): Promise<SeatGroupResponse> {
  const res = await proxyFetch(seatGroupsBase(eid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatGroupResponse } = await res.json();
  return body.data;
}

export async function updateSeatGroup(
  eid: string,
  gid: string,
  request: SeatGroupUpdateRequest,
): Promise<SeatGroupResponse> {
  const res = await proxyFetch(`${seatGroupsBase(eid)}/${gid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatGroupResponse } = await res.json();
  return body.data;
}

export async function deleteSeatGroup(eid: string, gid: string): Promise<SeatGroupDeleteResponse> {
  const res = await proxyFetch(`${seatGroupsBase(eid)}/${gid}`, { method: 'DELETE' });
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatGroupDeleteResponse } = await res.json();
  return body.data;
}

/** groupNo는 Int — seat-groups의 UUID gid와 다른 식별자다(호출부에서 혼용 금지). */
export async function listSeatAssignments(eid: string, groupNo: number): Promise<SeatSlotResponse[]> {
  const params = new URLSearchParams({
    groupNo: String(groupNo),
    page: '1',
    size: String(SEAT_ASSIGN_PAGE_SIZE),
  });
  const res = await proxyFetch(`${seatAssignmentsBase(eid)}?${params.toString()}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatSlotResponse[] } = await res.json();
  return body.data;
}

export async function replaceSeatAssignments(
  eid: string,
  request: SeatAssignmentBulkUpdateRequest,
): Promise<SeatSlotResponse[]> {
  const res = await proxyFetch(seatAssignmentsBase(eid), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SeatSlotResponse[] } = await res.json();
  return body.data;
}
