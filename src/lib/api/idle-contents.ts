import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type { IdleContent } from '@/types/kiosk';
import type {
  IdleContentCreateRequest,
  IdleContentUpdateRequest,
  IdleContentDeleteResponse,
} from '@/types/idle-content';

const idleContentsBase = (eid: string) => `api/events/${eid}/idle-contents`;
// trailing slash 없음 — branding.ts/seats.ts와 동일 규약. 콘솔 admin 경로(`api/events/...`)는
// 키오스크 공개 경로(`api/public/events/.../idle-contents` — lib/api/kiosk.ts)와 별개다.

export async function listIdleContents(eid: string): Promise<IdleContent[]> {
  const res = await proxyFetch(idleContentsBase(eid));
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContent[] } = await res.json();
  return body.data;
}

/**
 * multipart 업로드 — File은 요청 DTO 필드가 아닌 별도 전송 파라미터로 받는다(guests.ts
 * previewImport/confirmImport 미러). Content-Type 헤더를 직접 지정하지 않는다 — 브라우저가
 * boundary 포함해 자동 설정한다(react.md §6-2, 직접 지정 시 boundary 누락으로 파싱 실패).
 *
 * mode·play는 falsy(null·빈 문자열)이면 파트 자체를 append하지 않는다 — FormData에 빈
 * 문자열을 담으면 서버가 ""(빈 문자열)로 바인딩해 기존 JSON 경로의 null 의미와 달라지기
 * 때문이다(behavior-preserving — 파트 부재 시 서버가 null로 바인딩).
 */
export async function createIdleContent(
  eid: string,
  file: File,
  request: IdleContentCreateRequest,
): Promise<IdleContent> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', request.name);
  formData.append('kind', request.kind);
  if (request.mode) formData.append('mode', request.mode);
  if (request.play) formData.append('play', request.play);
  formData.append('sortOrder', String(request.sortOrder));
  const res = await proxyFetch(idleContentsBase(eid), { method: 'POST', body: formData });
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

export async function deleteIdleContent(eid: string, cid: string): Promise<IdleContentDeleteResponse> {
  const res = await proxyFetch(`${idleContentsBase(eid)}/${cid}`, { method: 'DELETE' });
  if (!res.ok) return throwOnError(res);
  const body: { data: IdleContentDeleteResponse } = await res.json();
  return body.data;
}
