import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type {
  SmsTemplateResponse,
  SmsTemplateUpdateRequest,
  SmsPreviewResponse,
  SmsGateResponse,
  SmsSendRequest,
  SmsSendResultResponse,
  SmsResendRequest,
  SmsSendItem,
  SmsLogResponse,
} from '@/types/sms';

// SmsController 루트는 `/api/events/{eid}` 그 자체(GuestController와 달리 별도 `/guests`
// 세그먼트가 없음 — 실측 사실 H) — sms-template/sms/sms-log는 이 base에 바로 이어붙인다.
const smsBase = (eid: string) => `api/events/${eid}`;

export async function getSmsTemplate(eid: string): Promise<SmsTemplateResponse> {
  const res = await proxyFetch(`${smsBase(eid)}/sms-template`);
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsTemplateResponse } = await res.json();
  return body.data;
}

export async function upsertSmsTemplate(eid: string, request: SmsTemplateUpdateRequest): Promise<SmsTemplateResponse> {
  const res = await proxyFetch(`${smsBase(eid)}/sms-template`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsTemplateResponse } = await res.json();
  return body.data;
}

/** gid 기준 미리보기 — 이름 매칭 아님(사실 H). 서버 `rendered` 그대로 반환. */
export async function previewSms(eid: string, guestId: string): Promise<SmsPreviewResponse> {
  const res = await proxyFetch(`${smsBase(eid)}/sms-template/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId }),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsPreviewResponse } = await res.json();
  return body.data;
}

/** read-only 게이트 계산 — `excludeAlreadySent` 토글이 바뀌면 이 함수 재호출(useQuery 키에 포함). */
export async function gateSms(eid: string, excludeAlreadySent: boolean): Promise<SmsGateResponse> {
  const res = await proxyFetch(`${smsBase(eid)}/sms/send/gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ excludeAlreadySent }),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsGateResponse } = await res.json();
  return body.data;
}

/** confirm:true 필수 — ConfirmDialog 통과 후에만 호출. 서버가 게이트를 다시 재검증한다. */
export async function sendSms(eid: string, request: SmsSendRequest): Promise<SmsSendResultResponse> {
  const res = await proxyFetch(`${smsBase(eid)}/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsSendResultResponse } = await res.json();
  return body.data;
}

export async function resendSms(eid: string, request: SmsResendRequest): Promise<SmsSendItem> {
  const res = await proxyFetch(`${smsBase(eid)}/sms/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsSendItem } = await res.json();
  return body.data;
}

export async function listSmsLog(eid: string): Promise<SmsLogResponse[]> {
  const res = await proxyFetch(`${smsBase(eid)}/sms-log`);
  if (!res.ok) return throwOnError(res);
  const body: { data: SmsLogResponse[] } = await res.json();
  return body.data;
}
