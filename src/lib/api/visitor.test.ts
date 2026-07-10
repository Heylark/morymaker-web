import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitorApiError, getHub, getOnsiteForm, preregPlate, registerOnsite } from './visitor';
import type { OnsiteRegisterRequest } from '@/types/visitor';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('lib/api/visitor — BFF 프록시 경유 방문자 공개 도메인 함수', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getHub — 토큰을 인코딩해 허브 경로를 호출하고 data를 꺼낸다', async () => {
    const hub = {
      guest: { name: '김민준', org: null, title: null, seatLabel: null, plate: null, status: '대기' },
      event: { name: '행사', place: null, eventDate: null, bgColor: null, pointColor: null },
      checkinQr: { url: 'https://event.morymaker.co.kr/u/tok 1', token: 'tok 1' },
      prereg: { plateRegistered: false, plate: null },
      parkingEntry: { scanUrl: 'https://event.morymaker.co.kr/p/z1' },
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: hub }));

    const result = await getHub('tok 1');

    expect(fetch).toHaveBeenCalledWith('/api/proxy/api/public/u/tok%201', undefined);
    expect(result).toEqual(hub);
  });

  it('getHub — 무효 token은 404 VisitorApiError로 던진다(enumeration-safe)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'NOT_FOUND', message: '유효하지 않은 링크입니다' } }, 404),
    );

    await expect(getHub('bad-token')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    await expect(getHub('bad-token')).rejects.toBeInstanceOf(VisitorApiError);
  });

  it('preregPlate — POST + JSON 바디로 호출하고 성공(200) 시 {plate,message}만 꺼낸다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { plate: '12가3456', message: '등록되었습니다' } }, 200));

    const result = await preregPlate('tok1', '12가3456');

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/proxy/api/public/u/tok1/prereg-plate');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ plate: '12가3456' });
    expect(result).toEqual({ plate: '12가3456', message: '등록되었습니다' });
  });

  it('preregPlate — 빈 값은 400 VALIDATION_FAILED(field=plate)로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '차량번호를 입력하세요', field: 'plate' } }, 400),
    );

    await expect(preregPlate('tok1', '')).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });

  it('getOnsiteForm — eventCode를 인코딩해 현장등록 폼 경로를 호출한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ data: { event: { name: '행사', bgColor: null, pointColor: null } } }),
    );

    const result = await getOnsiteForm('evt code');

    expect(fetch).toHaveBeenCalledWith('/api/proxy/api/public/r/evt%20code', undefined);
    expect(result).toEqual({ event: { name: '행사', bgColor: null, pointColor: null } });
  });

  it('getOnsiteForm — 종료된 행사는 409 EVENT_CLOSED로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'EVENT_CLOSED', message: '종료된 행사입니다' } }, 409),
    );

    await expect(getOnsiteForm('evt1')).rejects.toMatchObject({ status: 409, code: 'EVENT_CLOSED' });
  });

  it('registerOnsite — 성공은 201이며 res.ok로 판정해 data를 꺼낸다(=== 200 아님)', async () => {
    const registerResult = {
      guestId: 'g1',
      token: 'tok-new',
      checkinQr: { url: 'https://event.morymaker.co.kr/u/tok-new', token: 'tok-new' },
      message: '등록이 완료되었습니다',
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: registerResult }, 201));

    const request: OnsiteRegisterRequest = { name: '이서연' };
    const result = await registerOnsite('evt1', request);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/proxy/api/public/r/evt1');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(request);
    expect(result).toEqual(registerResult);
  });

  it('registerOnsite — rate limit 초과는 429로 던진다(사전등록 POST와 달리 등록 POST만 제한)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'RATE_LIMITED', message: '잠시 후 다시 시도해 주세요' } }, 429),
    );

    await expect(registerOnsite('evt1', { name: '이서연' })).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
    });
  });

  it('registerOnsite — name 누락은 400(field=name)으로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '성함을 입력하세요', field: 'name' } }, 400),
    );

    await expect(registerOnsite('evt1', { name: '' })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
    });
  });
});
