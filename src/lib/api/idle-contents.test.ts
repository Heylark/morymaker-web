import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdleContent, deleteIdleContent } from './idle-contents';
import type { IdleContentCreateRequest } from '@/types/idle-content';

function jsonResponse(body: unknown, status = 201): Response {
  return new Response(JSON.stringify(body), { status });
}

function baseRequest(overrides: Partial<IdleContentCreateRequest> = {}): IdleContentCreateRequest {
  return { name: '입장 안내', kind: '이미지', mode: null, play: null, sortOrder: 0, ...overrides };
}

/**
 * createIdleContent가 FormData 파트를 계약대로 조립하는지 검증한다(R2 — guests.ts
 * previewImport/confirmImport 미러). 핵심은 (1) Content-Type을 직접 지정하지 않는지
 * (브라우저가 boundary 포함해 자동 설정 — react.md §6-2), (2) mode·play가 null이면 파트 자체를
 * append하지 않는지(behavior-preserving — 빈 문자열 바인딩과 null 의미를 다르게 유지)다.
 */
describe('lib/api/idle-contents — createIdleContent (multipart 업로드)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('file·name·kind·sortOrder를 FormData 파트로 담아 전송하고 Content-Type 헤더를 직접 지정하지 않는다', async () => {
    const content = { id: 'c1', name: '입장 안내', kind: '이미지', mode: null, play: null, fileUrl: null, sortOrder: 0 };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: content }));
    const file = new File(['x'], 'welcome.png', { type: 'image/png' });

    await createIdleContent('evt1', file, baseRequest());

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt1/idle-contents');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toBeUndefined();
    const body = init?.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('name')).toBe('입장 안내');
    expect(body.get('kind')).toBe('이미지');
    expect(body.get('sortOrder')).toBe('0');
  });

  it('mode·play가 null이면 해당 파트를 append하지 않는다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: { id: 'c1', name: '입장 안내', kind: '이미지', mode: null, play: null, fileUrl: null, sortOrder: 0 },
      }),
    );
    const file = new File(['x'], 'welcome.png', { type: 'image/png' });

    await createIdleContent('evt1', file, baseRequest({ mode: null, play: null }));

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = init?.body as FormData;
    expect(body.has('mode')).toBe(false);
    expect(body.has('play')).toBe(false);
  });

  it('mode·play가 채워지면 해당 파트를 append한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: { id: 'c1', name: '환영 영상', kind: '영상', mode: 'branded', play: '자동재생', fileUrl: null, sortOrder: 3 },
      }),
    );
    const file = new File(['x'], 'welcome.mp4', { type: 'video/mp4' });

    await createIdleContent('evt1', file, baseRequest({ kind: '영상', mode: 'branded', play: '자동재생', sortOrder: 3 }));

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = init?.body as FormData;
    expect(body.get('mode')).toBe('branded');
    expect(body.get('play')).toBe('자동재생');
  });

  it('201 응답에서 data를 그대로 반환한다', async () => {
    const content = { id: 'c1', name: '입장 안내', kind: '이미지', mode: null, play: null, fileUrl: null, sortOrder: 0 };
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: content }));
    const file = new File(['x'], 'welcome.png', { type: 'image/png' });

    const result = await createIdleContent('evt1', file, baseRequest());
    expect(result).toEqual(content);
  });
});

/**
 * deleteIdleContent가 lib/api/seats.ts deleteSeatGroup을 정확히 미러하는지 검증한다 — DELETE
 * 메서드·경로변수(eid·cid) 조립·응답 {data:{cid}}에서 cid 반환까지 동일 계약이다(PATTERN-051 완결).
 */
describe('lib/api/idle-contents — deleteIdleContent', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('DELETE 메서드로 /api/events/{eid}/idle-contents/{cid}를 호출한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { cid: 'c1' } }, 200));

    await deleteIdleContent('evt1', 'c1');

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/app/api/proxy/api/events/evt1/idle-contents/c1');
    expect(init?.method).toBe('DELETE');
  });

  it('200 응답 {data:{cid}}에서 cid를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: { cid: 'c1' } }, 200));

    const result = await deleteIdleContent('evt1', 'c1');

    expect(result).toEqual({ cid: 'c1' });
  });
});
