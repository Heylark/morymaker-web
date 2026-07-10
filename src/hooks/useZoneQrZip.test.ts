import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerZipDownload } from './useZoneQrZip';
import { ConsoleApiError } from '@/lib/api/console';

/**
 * 렌더 없이 Content-Type 가드 로직만 단위 테스트한다(vitest.config.ts가 jsdom 없이
 * node 환경만 제공 — 컴포넌트 렌더 테스트는 별도 인프라 필요, tech-debt 등록).
 * 실패 경로(401 JSON)는 document API에 도달하기 전에 throw하므로 node 환경에서도 검증 가능하다.
 */
describe('useZoneQrZip — triggerZipDownload Content-Type 가드', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('401 + application/json 응답이면 zip으로 저장하지 않고 ConsoleApiError를 던진다', async () => {
    const jsonRes = new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    vi.mocked(fetch).mockResolvedValue(jsonRes);

    await expect(triggerZipDownload('evt-1', 'z1', '지하 2층')).rejects.toBeInstanceOf(ConsoleApiError);
    await expect(triggerZipDownload('evt-1', 'z1', '지하 2층')).rejects.toMatchObject({
      status: 401,
      code: 'QR_ZIP_DOWNLOAD_FAILED',
    });
  });

  it('200이지만 Content-Type이 application/zip이 아니면 다운로드하지 않고 던진다', async () => {
    const htmlRes = new Response('<html>error page</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
    vi.mocked(fetch).mockResolvedValue(htmlRes);

    await expect(triggerZipDownload('evt-1', 'z1', '지하 2층')).rejects.toMatchObject({
      code: 'QR_ZIP_DOWNLOAD_FAILED',
    });
  });
});
