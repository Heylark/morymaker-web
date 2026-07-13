import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type { AccountResponse, AccountCreateRequest, AccountUpdateRequest, AccountStatusRequest } from '@/types/account';

/**
 * 계정 어드민(ADM-11) 도메인 신규 파일 — `lib/api/console.ts`(IA·셸 기반)는 동결 경계라 무접촉
 * 원칙을 지키기 위해 `guests.ts`와 동일하게 `console-http.ts`의 공유 `throwOnError`를 재사용한다
 * (`ConsoleApiError` 타입은 콘솔 전역에서 하나로 유지 — console-http.ts가 재-export).
 */

const accountsBase = 'api/accounts';
// trailing slash 없음 — console.ts/guests.ts와 동일 규약(3분법 PRIVATE 판정 정합).

/**
 * MVP는 검색·페이지네이션 UI를 두지 않는다(01-planner.md Assumptions) — 쿼리 파라미터 없이
 * 호출하면 auth가 기본값(page=1·size=50)을 적용해 사실상 전체 목록을 반환한다.
 */
export async function listAccounts(): Promise<AccountResponse[]> {
  const res = await proxyFetch(accountsBase);
  if (!res.ok) return throwOnError(res);
  const body: { data: AccountResponse[] } = await res.json();
  return body.data;
}

/** POST — SYSTEM_ADMIN 전용(EVENT_ADMIN은 auth가 403 ROLE_FORBIDDEN으로 최종 방어). */
export async function createAccount(request: AccountCreateRequest): Promise<AccountResponse> {
  const res = await proxyFetch(accountsBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: AccountResponse } = await res.json();
  return body.data;
}

/** email·password는 서버 불변 필드라 요청 타입에 아예 없다(이메일 변경·비밀번호 재설정은 범위 밖). */
export async function updateAccount(id: string, request: AccountUpdateRequest): Promise<AccountResponse> {
  const res = await proxyFetch(`${accountsBase}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: AccountResponse } = await res.json();
  return body.data;
}

/** 하드 삭제 아님(이력 보존) — 활성/비활성 토글로 대체(DELETE 엔드포인트 자체가 없음). */
export async function updateAccountStatus(id: string, request: AccountStatusRequest): Promise<AccountResponse> {
  const res = await proxyFetch(`${accountsBase}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: AccountResponse } = await res.json();
  return body.data;
}
