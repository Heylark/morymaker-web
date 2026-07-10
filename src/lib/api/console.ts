import { proxyFetch } from '@/lib/proxy-fetch';
import type { ZoneResponse, ZoneCreateRequest, ZoneUpdateRequest, SlotForQrResponse } from '@/types/console';

/** api 공통 에러 포맷(GlobalExceptionHandler — `{ error: { code, message, field } }`). */
interface ApiErrorBody {
  error: { code: string; message: string; field?: string | null };
}

/** 관리자 콘솔 API 실패를 코드와 함께 표준화 — 호출부가 message 파싱이 아니라 code로 분기. */
export class ConsoleApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`콘솔 API 요청 실패 (${status} ${code})`);
  }
}

async function throwOnError(res: Response): Promise<never> {
  const body: ApiErrorBody | null = await res.json().catch(() => null);
  throw new ConsoleApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR');
}

const zonesBase = (eid: string) => `api/events/${eid}/parking-zones`;
// trailing slash 없음 — next.config에 trailingSlash 미설정(staff 패턴 교차검증). 3분법 PRIVATE 판정 정합.

export async function listZones(eid: string): Promise<ZoneResponse[]> {
  const res = await proxyFetch(zonesBase(eid));
  if (!res.ok) return throwOnError(res);
  const body: { data: ZoneResponse[] } = await res.json();
  return body.data;
}

export async function createZone(eid: string, request: ZoneCreateRequest): Promise<ZoneResponse> {
  const res = await proxyFetch(zonesBase(eid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: ZoneResponse } = await res.json();
  return body.data;
}

export async function updateZone(eid: string, zid: string, request: ZoneUpdateRequest): Promise<ZoneResponse> {
  const res = await proxyFetch(`${zonesBase(eid)}/${zid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: ZoneResponse } = await res.json();
  return body.data;
}

export async function listSlotsForQr(eid: string, zid: string): Promise<SlotForQrResponse[]> {
  const res = await proxyFetch(`${zonesBase(eid)}/${zid}/slots`);
  if (!res.ok) return throwOnError(res);
  const body: { data: SlotForQrResponse[] } = await res.json();
  return body.data;
}

/**
 * qr-zip 다운로드 — Response를 그대로 반환한다(blob·Content-Type 가드는 훅에서).
 * 성공(200)이면 application/zip 스트림, 401 등이면 프록시가 JSON을 반환하므로 훅이
 * Content-Type을 확인해 JSON을 zip으로 저장하지 않게 막는다.
 */
export function downloadZoneQrZip(eid: string, zid: string): Promise<Response> {
  return proxyFetch(`${zonesBase(eid)}/${zid}/qr-zip`);
}
