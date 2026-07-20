import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  StaffApiError,
  checkin,
  checkoutParking,
  clearReview,
  listParkingRecords,
  lookup,
  registerParking,
  scanPreview,
} from './staff';
import type { RegisterParkingRequest } from '@/types/staff';

const REGISTER_REQUEST: RegisterParkingRequest = {
  slotSig: '지하 2층·A구역·3',
  zoneId: 'z1',
  plate: '12가3456',
  registeredBy: '요원',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('lib/api/staff — BFF 프록시 경유 실행자 도메인 함수', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('lookup — 쿼리 파라미터를 URL에 인코딩해 프록시 경로를 호출하고 응답을 그대로 반환한다', async () => {
    const payload = { data: [{ guestId: 'g1', name: '김민준' }], meta: { total: 1, searchState: 'ONE' } };
    vi.mocked(fetch).mockResolvedValue(jsonResponse(payload));

    const result = await lookup('evt-1', '김 민준');

    expect(fetch).toHaveBeenCalledWith('/app/api/proxy/api/events/evt-1/lookup?q=%EA%B9%80%20%EB%AF%BC%EC%A4%80', undefined);
    expect(result).toEqual(payload);
  });

  it('listParkingRecords — 필터를 쿼리스트링으로 조립하고 data 배열만 꺼낸다', async () => {
    const records = [{ id: 'r1', zoneId: 'z1', slotSig: 's', slotDisplay: 'd', plate: '12가3456' }];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: records }));

    const result = await listParkingRecords('evt-1', { zoneId: 'z1', reviewNeeded: true });

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt-1/parking-records?zoneId=z1&reviewNeeded=true');
    expect(result).toEqual(records);
  });

  it('listParkingRecords — 필터 없으면 쿼리스트링 없이 호출한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: [] }));
    await listParkingRecords('evt-1');
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt-1/parking-records');
  });

  it('registerParking — POST + JSON 바디로 호출하고 성공 시 data를 꺼낸다', async () => {
    const registerResult = { result: 'PARKED', record: {}, mapping: null, supersededRecord: null, message: null };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: registerResult }, 201));

    const result = await registerParking('evt-1', REGISTER_REQUEST);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt-1/parking-records');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(REGISTER_REQUEST);
    expect(result).toEqual(registerResult);
  });

  it('registerParking — 409 SLOT_OCCUPIED는 StaffApiError(code 포함)로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'SLOT_OCCUPIED', message: '이미 사용 중인 자리입니다' } }, 409),
    );

    await expect(registerParking('evt-1', REGISTER_REQUEST)).rejects.toMatchObject({
      status: 409,
      code: 'SLOT_OCCUPIED',
    });
    await expect(registerParking('evt-1', REGISTER_REQUEST)).rejects.toBeInstanceOf(StaffApiError);
  });

  it('checkoutParking / clearReview — {id} 경로로 POST하고 data를 꺼낸다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'r1', status: '출차' } }));
    const checkoutResult = await checkoutParking('evt-1', 'r1');
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/app/api/proxy/api/events/evt-1/parking-records/r1/checkout');
    expect(checkoutResult).toEqual({ id: 'r1', status: '출차' });

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'r1', reviewNeeded: false } }));
    await clearReview('evt-1', 'r1');
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/app/api/proxy/api/events/evt-1/parking-records/r1/review-clear');
  });

  it('scanPreview — token을 인코딩해 프리뷰 경로를 호출한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'g1', name: '이서연' } }));
    await scanPreview('evt-1', 't 1000');
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/app/api/proxy/api/events/evt-1/checkin/scan/t%201000');
  });

  it('checkin — POST + JSON 바디로 체크인 요청을 보낸다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ data: { resultCode: 'CHECKED_IN', guest: {}, parking: null } }),
    );
    const result = await checkin('evt-1', { token: 't1000' });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt-1/checkin');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ token: 't1000' });
    expect(result.resultCode).toBe('CHECKED_IN');
  });
});
