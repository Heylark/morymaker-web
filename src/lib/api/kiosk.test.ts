import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KioskApiError, checkin, idleContents, nameSearch, parkingSearch } from './kiosk';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('lib/api/kiosk — BFF 프록시 경유 키오스크 공개 도메인 함수', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('nameSearch — meta.searchState·total을 함께 꺼낸다(이름검색 전용 meta, §0 실측 정정)', async () => {
    const attendees = [{ guestId: 'g1', name: '김민준', org: null, seatLabel: 'A-1', status: '참석' }];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: attendees, meta: { total: 1, searchState: 'ONE' } }));

    const result = await nameSearch('evt1', '김민준');

    expect(fetch).toHaveBeenCalledWith(
      '/app/api/proxy/api/public/events/evt1/attendees?name=%EA%B9%80%EB%AF%BC%EC%A4%80',
      undefined,
    );
    expect(result).toEqual({ attendees, searchState: 'ONE', total: 1 });
  });

  it('nameSearch — 2자 미만은 400 KioskApiError로 던진다(서버 min 2자 검증)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '이름을 2자 이상 입력하세요' } }, 400),
    );

    await expect(nameSearch('evt1', '김')).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    await expect(nameSearch('evt1', '김')).rejects.toBeInstanceOf(KioskApiError);
  });

  it('nameSearch — 무효 eid는 404로 던진다(eid 사전 게이트 대신 최초 액션 404로 대체)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'NOT_FOUND', message: '유효하지 않은 행사입니다' } }, 404),
    );

    await expect(nameSearch('bad-eid', '김민준')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('checkin — POST + JSON {guestId} 바디로 호출하고 200 응답에서 data를 꺼낸다', async () => {
    const result = {
      resultCode: 'CHECKED_IN',
      guest: { name: '김민준', org: null, status: '참석', seatLabel: 'A-1' },
      parking: { display: '지하 2층 A구역 3' },
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: result }, 200));

    const response = await checkin('evt1', 'g1');

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/public/events/evt1/checkin');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ guestId: 'g1' });
    expect(response).toEqual(result);
  });

  it('checkin — 이미 체크인된 참석자도 200 ALREADY_CHECKED_IN으로 응답한다(멱등, 재확정 안전)', async () => {
    const result = {
      resultCode: 'ALREADY_CHECKED_IN',
      guest: { name: '김민준', org: null, status: '참석', seatLabel: 'A-1' },
      parking: null,
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: result }, 200));

    const response = await checkin('evt1', 'g1');
    expect(response.resultCode).toBe('ALREADY_CHECKED_IN');
    expect(response.parking).toBeNull();
  });

  it('checkin — guestId 공백은 400으로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '참석자를 선택하세요' } }, 400),
    );

    await expect(checkin('evt1', '')).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });

  it('parkingSearch — meta 없이 data 배열만 반환한다(§0 실측 정정 — 이름검색과 소스 비대칭)', async () => {
    const records = [{ plate: '12가3456', slotDisplay: '지하 2층 A구역 3번' }];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: records }));

    const result = await parkingSearch('evt1', '3456');

    expect(fetch).toHaveBeenCalledWith('/app/api/proxy/api/public/events/evt1/parking-search?plateTail=3456', undefined);
    expect(result).toEqual(records);
  });

  it('parkingSearch — plateTail 형식 위반은 400으로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '차량번호 뒷자리 4자리를 입력하세요' } }, 400),
    );

    await expect(parkingSearch('evt1', 'abcd')).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });

  it('idleContents — 무효 eid도 fail-open(200 빈 배열)으로 응답한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: [] }));

    const result = await idleContents('bad-eid');
    expect(result).toEqual([]);
  });

  it('idleContents — kind·play는 한글 자유 텍스트, mode는 nullable 영문으로 그대로 반환한다(union 아님)', async () => {
    const contents = [
      { id: 'c1', name: '환영 영상', kind: '영상', mode: 'branded', play: '자동재생', fileUrl: null, sortOrder: 0 },
    ];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: contents }));

    const result = await idleContents('evt1');
    expect(result).toEqual(contents);
  });
});
