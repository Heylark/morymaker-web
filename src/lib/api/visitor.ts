import { proxyFetch } from '@/lib/proxy-fetch';
import type {
  OnsiteForm,
  OnsiteRegisterRequest,
  OnsiteRegisterResult,
  PreregResult,
  PublicHub,
  PublicSlotView,
  RecordRegisterRequest,
  RecordRegisterResult,
  VisitorApiErrorBody,
} from '@/types/visitor';

/**
 * 방문자 공개 API 호출 실패를 코드와 함께 표준화한다(`StaffApiError` 미러) — 호출부가
 * 메시지 문자열 파싱이 아니라 `code`·`status`로 분기한다(예: 404 vs 409 EVENT_CLOSED 구분).
 */
export class VisitorApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`방문자 API 요청 실패 (${status} ${code})`);
  }
}

/** 실패 응답 본문을 표준 에러 포맷으로 파싱해 던진다 — 본문이 그 형태가 아니어도 안전하게 처리한다. */
async function throwOnError(res: Response): Promise<never> {
  const body: VisitorApiErrorBody | null = await res.json().catch(() => null);
  throw new VisitorApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR');
}

// ── VIS-00 개인허브 ───────────────────────────────────────────────────────────

export async function getHub(token: string): Promise<PublicHub> {
  const res = await proxyFetch(`api/public/u/${encodeURIComponent(token)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: PublicHub } = await res.json();
  return body.data;
}

export async function preregPlate(token: string, plate: string): Promise<PreregResult> {
  const res = await proxyFetch(`api/public/u/${encodeURIComponent(token)}/prereg-plate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate }),
  });
  // 성공은 200 — 전체 허브가 아니라 변경 필드(plate)만 반환한다(호출부 갱신 전략은 hooks 참고).
  if (!res.ok) return throwOnError(res);
  const body: { data: PreregResult } = await res.json();
  return body.data;
}

// ── VIS-02 현장등록 ───────────────────────────────────────────────────────────

export async function getOnsiteForm(eventCode: string): Promise<OnsiteForm> {
  const res = await proxyFetch(`api/public/r/${encodeURIComponent(eventCode)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: OnsiteForm } = await res.json();
  return body.data;
}

export async function registerOnsite(
  eventCode: string,
  request: OnsiteRegisterRequest,
): Promise<OnsiteRegisterResult> {
  const res = await proxyFetch(`api/public/r/${encodeURIComponent(eventCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  // 성공은 200이 아니라 201 Created — res.ok(200~299 전부 true)로 판정해 안전하게 포함한다.
  if (!res.ok) return throwOnError(res);
  const body: { data: OnsiteRegisterResult } = await res.json();
  return body.data;
}

// ── VIS-01 자리 QR 셀프 주차 ──────────────────────────────────────────────────

export async function getSlotView(slotCode: string): Promise<PublicSlotView> {
  const res = await proxyFetch(`api/public/p/${encodeURIComponent(slotCode)}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: PublicSlotView } = await res.json();
  return body.data;
}

export async function selfPark(
  slotCode: string,
  request: RecordRegisterRequest,
): Promise<RecordRegisterResult> {
  const res = await proxyFetch(`api/public/p/${encodeURIComponent(slotCode)}/park`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  // 성공은 201(PARKED) 또는 200(SUPERSEDED|RE_REGISTERED) — res.ok로 둘 다 안전하게 포함한다.
  if (!res.ok) return throwOnError(res);
  const body: { data: RecordRegisterResult } = await res.json();
  return body.data;
}
