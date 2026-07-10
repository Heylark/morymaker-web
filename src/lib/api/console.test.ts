import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConsoleApiError,
  createZone,
  downloadZoneQrZip,
  listSlotsForQr,
  listZones,
  updateZone,
} from './console';
import type { ZoneCreateRequest, ZoneUpdateRequest } from '@/types/console';

const CREATE_REQUEST: ZoneCreateRequest = { part1: '지하 2층', part2: 'A구역', startNo: 1, slotCount: 10 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('lib/api/console — BFF 프록시 경유 관리자 콘솔 주차 구획 함수', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('listZones — 프록시 경로를 호출하고 data 배열만 꺼낸다', async () => {
    const zones = [{ id: 'z1', part1: '지하 2층', zoneName: '지하 2층' }];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: zones }));

    const result = await listZones('evt-1');

    expect(fetch).toHaveBeenCalledWith('/api/proxy/api/events/evt-1/parking-zones', undefined);
    expect(result).toEqual(zones);
  });

  it('createZone — POST + JSON 바디로 호출하고 201 응답의 data를 꺼낸다', async () => {
    const created = { id: 'z1', ...CREATE_REQUEST };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: created }, 201));

    const result = await createZone('evt-1', CREATE_REQUEST);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/proxy/api/events/evt-1/parking-zones');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(CREATE_REQUEST);
    expect(result).toEqual(created);
  });

  it('updateZone — PUT `.../parking-zones/z1`으로 titleOverrides를 포함한 바디를 보낸다', async () => {
    const request: ZoneUpdateRequest = { ...CREATE_REQUEST, titleOverrides: { '1': '입구' } };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { id: 'z1', ...request } }));

    const result = await updateZone('evt-1', 'z1', request);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/proxy/api/events/evt-1/parking-zones/z1');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(init?.body as string)).toEqual(request);
    expect(result).toMatchObject({ id: 'z1' });
  });

  it('listSlotsForQr — `.../parking-zones/z1/slots`를 호출하고 data를 꺼낸다', async () => {
    const slots = [{ slotNo: 1, slotCode: 'z1-01', slotFullName: '지하 2층 1', scanUrl: 'https://park.example.com/p/z1-01' }];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: slots }));

    const result = await listSlotsForQr('evt-1', 'z1');

    expect(fetch).toHaveBeenCalledWith('/api/proxy/api/events/evt-1/parking-zones/z1/slots', undefined);
    expect(result).toEqual(slots);
  });

  it('downloadZoneQrZip — `.../parking-zones/z1/qr-zip`을 호출하고 Response를 그대로 반환한다', async () => {
    const zipResponse = new Response(new Blob(['zip-bytes']), {
      status: 200,
      headers: { 'Content-Type': 'application/zip' },
    });
    vi.mocked(fetch).mockResolvedValue(zipResponse);

    const result = await downloadZoneQrZip('evt-1', 'z1');

    expect(fetch).toHaveBeenCalledWith('/api/proxy/api/events/evt-1/parking-zones/z1/qr-zip', undefined);
    expect(result).toBe(zipResponse);
  });

  it('4xx 응답은 ConsoleApiError(code 포함)로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_ERROR', message: '구분1은 필수입니다' } }, 400),
    );

    await expect(createZone('evt-1', CREATE_REQUEST)).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
    await expect(createZone('evt-1', CREATE_REQUEST)).rejects.toBeInstanceOf(ConsoleApiError);
  });
});
