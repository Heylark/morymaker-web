import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type { EventBrandingUpdateRequest, EventResponse } from '@/types/console';

const brandingBase = (eid: string) => `api/events/${eid}/branding`;
// trailing slash 없음 — seats.ts/console.ts 이벤트 함수와 동일 규약. GET 전용 엔드포인트는
// 없다 — 브랜딩 조회는 기존 useEvent(eid)를 재사용한다(EventResponse가 4색을 이미 보유).

export async function updateBranding(eid: string, request: EventBrandingUpdateRequest): Promise<EventResponse> {
  const res = await proxyFetch(brandingBase(eid), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: EventResponse } = await res.json();
  return body.data;
}
