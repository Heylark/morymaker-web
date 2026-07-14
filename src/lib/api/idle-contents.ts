import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type { IdleContent } from '@/types/kiosk';
import type { IdleContentCreateRequest, IdleContentUpdateRequest } from '@/types/idle-content';

const idleContentsBase = (eid: string) => `api/events/${eid}/idle-contents`;
// trailing slash 없음 — branding.ts/seats.ts와 동일 규약. 콘솔 admin 경로(`api/events/...`)는
// 키오스크 공개 경로(`api/public/events/.../idle-contents` — lib/api/kiosk.ts)와 별개다.
//
// ⚠️ DELETE 엔드포인트가 api에 없다 — 삭제 함수를 이 파일에 만들지 않는다(실수로 존재하지
// 않는 엔드포인트를 호출하는 코드 자체가 생기지 않게 막는 의도적 누락).

export async function listIdleContents(eid: string): Promise<IdleContent[]> {
  const res = await proxyFetch(idleContentsBase(eid));
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContent[] } = await res.json();
  return body.data;
}

export async function createIdleContent(eid: string, request: IdleContentCreateRequest): Promise<IdleContent> {
  const res = await proxyFetch(idleContentsBase(eid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContent } = await res.json();
  return body.data;
}

export async function updateIdleContent(
  eid: string,
  cid: string,
  request: IdleContentUpdateRequest,
): Promise<IdleContent> {
  const res = await proxyFetch(`${idleContentsBase(eid)}/${cid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContent } = await res.json();
  return body.data;
}
