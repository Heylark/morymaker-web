import { describe, expect, it, vi } from 'vitest';
import { proxyFetch } from './proxy-fetch';

/**
 * proxyFetch는 basePath 경계 지점(§0 두 좌표계) — 브라우저 fetch는 Next.js 라우터를 거치지
 * 않아 basePath가 자동으로 붙지 않는다. vitest.config.ts의 전역 NEXT_PUBLIC_BASE_PATH='/app'
 * 아래에서 실행되므로, 이 접두가 빠지면 즉시 RED가 된다(같은 도메인의 다른 서비스로 오배송되는
 * 실제 결함을 이 테스트가 재현한다).
 */
describe('proxyFetch — BFF 프록시 경계, BASE_PATH 접두', () => {
  it('api-절대경로 앞에 BASE_PATH + /api/proxy/ 를 붙여 fetch한다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await proxyFetch('api/events');
    expect(fetchSpy).toHaveBeenCalledWith('/app/api/proxy/api/events', undefined);
    fetchSpy.mockRestore();
  });

  it('선두 슬래시가 있어도 정규화 후 한 번만 접두한다(이중 슬래시 방지)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await proxyFetch('/api/public/x');
    expect(fetchSpy).toHaveBeenCalledWith('/app/api/proxy/api/public/x', undefined);
    fetchSpy.mockRestore();
  });

  it('RequestInit(method·body 등)을 그대로 전달한다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    const init: RequestInit = { method: 'POST', body: JSON.stringify({ a: 1 }) };
    await proxyFetch('api/events', init);
    expect(fetchSpy).toHaveBeenCalledWith('/app/api/proxy/api/events', init);
    fetchSpy.mockRestore();
  });

  it('BASE_PATH가 빈 문자열(로컬 개발)이면 접두 없이 /api/proxy/ 그대로 호출한다', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    const { proxyFetch: proxyFetchLocal } = await import('./proxy-fetch');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await proxyFetchLocal('api/events');
    expect(fetchSpy).toHaveBeenCalledWith('/api/proxy/api/events', undefined);
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
