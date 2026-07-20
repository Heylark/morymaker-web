import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccount, listAccounts, updateAccount, updateAccountStatus } from './accounts';
import { ConsoleApiError } from './console';
import type { AccountCreateRequest, AccountUpdateRequest } from '@/types/account';

const CREATE_REQUEST: AccountCreateRequest = {
  email: 'staff@example.com',
  role: 'EVENT_STAFF',
  eventIds: ['evt-1'],
  password: 'password123',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('lib/api/accounts — BFF 프록시 경유 계정 어드민 함수', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('listAccounts — api/accounts를 쿼리 없이 호출하고(MVP 검색·페이지네이션 UI 없음) data 배열만 꺼낸다', async () => {
    const accounts = [
      { id: 'a1', email: 'admin@example.com', name: null, role: 'SYSTEM_ADMIN', status: '활성', eventIds: [], note: null },
    ];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: accounts, meta: { total: 1, page: 1, size: 50 } }));

    const result = await listAccounts();

    expect(fetch).toHaveBeenCalledWith('/app/api/proxy/api/accounts', undefined);
    expect(result).toEqual(accounts);
  });

  it('createAccount — POST + JSON 바디로 호출하고 201 응답의 data를 꺼낸다', async () => {
    const created = { id: 'a2', ...CREATE_REQUEST, status: '활성', name: null, note: null };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: created }, 201));

    const result = await createAccount(CREATE_REQUEST);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/accounts');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(CREATE_REQUEST);
    expect(result).toEqual(created);
  });

  it('updateAccount — PUT api/accounts/{id}로 email·password 없는 바디를 보낸다(서버 불변 필드)', async () => {
    const request: AccountUpdateRequest = { name: '홍길동', role: 'EVENT_ADMIN', eventIds: ['evt-1'], note: null };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'a1', ...request } }));

    const result = await updateAccount('a1', request);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/accounts/a1');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(init?.body as string)).toEqual(request);
    expect(result).toMatchObject({ id: 'a1' });
  });

  it('updateAccountStatus — PUT api/accounts/{id}/status로 status만 보낸다(하드 삭제 없음 — 토글로 대체)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'a1', status: '비활성' } }));

    const result = await updateAccountStatus('a1', { status: '비활성' });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/accounts/a1/status');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(init?.body as string)).toEqual({ status: '비활성' });
    expect(result).toMatchObject({ status: '비활성' });
  });

  it('4xx 응답은 ConsoleApiError(code 포함)로 던진다 — 역할별 행사할당 필수 위반(422 BUSINESS_RULE)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'BUSINESS_RULE', message: 'EVENT_STAFF 역할은 담당 행사가 최소 1개 필요합니다' } }, 422),
    );

    // 순서 주의: mockResolvedValue가 같은 Response 인스턴스를 반환해 두 번째 호출은 body 스트림이
    // 이미 소진된 상태다(throwOnError가 .json() 실패를 catch해 code를 UNKNOWN_ERROR로 폴백) —
    // code까지 검증하는 단언을 먼저 실행해 신선한 body를 확보한다(console.test.ts와 동일 순서 규약).
    await expect(createAccount(CREATE_REQUEST)).rejects.toMatchObject({ status: 422, code: 'BUSINESS_RULE' });
    await expect(createAccount(CREATE_REQUEST)).rejects.toBeInstanceOf(ConsoleApiError);
  });
});
