import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleApiError } from './console';
import {
  GuestImportFilePasswordProtectedError,
  GuestImportFileUnreadableError,
  GuestImportHeaderMismatchError,
  IMPORT_FILE_PASSWORD_PROTECTED,
  IMPORT_FILE_UNREADABLE,
  IMPORT_HEADER_MISMATCH,
  confirmImport,
  downloadImportTemplate,
  previewImport,
} from './guests';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeFile(name = '명단.xlsx'): File {
  return new File(['dummy'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * previewImport/confirmImport는 공통 GuestExcelParser.parse()를 거치므로 헤더 불일치(400
 * IMPORT_HEADER_MISMATCH) 응답을 양쪽 모두 동일하게 받는다 — 02-architect §5-2 계약.
 */
describe('lib/api/guests — import 계열 에러 코드 분기(헤더 불일치 message 보존)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('previewImport — 400 IMPORT_HEADER_MISMATCH는 서버 message를 보존한 GuestImportHeaderMismatchError로 던진다', async () => {
    const message =
      "엑셀 첫 행 머리글이 업로드 양식과 다릅니다 — 1번째 칸은 '이름'이어야 하는데 'No.'입니다. 상단 [템플릿 받기]로 양식을 내려받아 그대로 채워 주세요.";
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: IMPORT_HEADER_MISMATCH, message } }, 400));

    const promise = previewImport('evt-1', makeFile());

    await expect(promise).rejects.toBeInstanceOf(GuestImportHeaderMismatchError);
    try {
      await promise;
      expect.fail('previewImport가 던지지 않았다');
    } catch (err) {
      const mismatchError = err as GuestImportHeaderMismatchError;
      expect(mismatchError.status).toBe(400);
      expect(mismatchError.message).toBe(message);
    }
  });

  it('confirmImport — 동일 400 IMPORT_HEADER_MISMATCH도 message를 보존한다(공용 파싱 경로 대칭)', async () => {
    const message = "2번째 칸은 '소속'이어야 하는데 '직함'입니다. 상단 [템플릿 받기]로 양식을 내려받아 그대로 채워 주세요.";
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: IMPORT_HEADER_MISMATCH, message } }, 400));

    try {
      await confirmImport('evt-1', makeFile());
      expect.fail('confirmImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(GuestImportHeaderMismatchError);
      expect((err as GuestImportHeaderMismatchError).status).toBe(400);
      expect((err as Error).message).toBe(message);
    }
  });

  it('previewImport — 헤더 불일치가 아닌 4xx(예: VALIDATION_FAILED)는 기존대로 ConsoleApiError로 던진다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION_FAILED', message: '파일이 비어 있습니다' } }, 400),
    );

    // Response.json()은 1회만 읽을 수 있어 같은 mock Response로 previewImport를 두 번 호출하면
    // 두 번째 호출의 body 파싱이 실패한다(throwOnImportError가 catch(() => null)로 삼켜
    // code가 UNKNOWN_ERROR로 뒤바뀜) — 단일 호출로 instanceof·status·code를 함께 검증한다.
    try {
      await previewImport('evt-1', makeFile());
      expect.fail('previewImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(ConsoleApiError);
      expect(err).not.toBeInstanceOf(GuestImportHeaderMismatchError);
      expect(err).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    }
  });

  it('confirmImport — 401 UNAUTHORIZED 등 무관 에러는 ConsoleApiError로 던진다(GuestImportHeaderMismatchError 아님)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: 'UNAUTHORIZED', message: '인증 필요' } }, 401));

    await expect(confirmImport('evt-1', makeFile())).rejects.toBeInstanceOf(ConsoleApiError);
    await expect(confirmImport('evt-1', makeFile())).rejects.not.toBeInstanceOf(GuestImportHeaderMismatchError);
  });

  it('downloadImportTemplate — 프록시 경로를 호출하고 raw Response를 그대로 반환한다', async () => {
    const xlsxResponse = new Response(new Blob(['xlsx-bytes']), {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });
    vi.mocked(fetch).mockResolvedValue(xlsxResponse);

    const result = await downloadImportTemplate('evt-1');

    expect(fetch).toHaveBeenCalledWith('/app/api/proxy/api/events/evt-1/guests/import/template', undefined);
    expect(result).toBe(xlsxResponse);
  });
});

/**
 * 엑셀로 열 수 없는 업로드 파일 — 형식 손상(IMPORT_FILE_UNREADABLE)과 암호 보호
 * (IMPORT_FILE_PASSWORD_PROTECTED)는 원인도 해결 방법도 달라 서버가 별도 코드·문구로 내려준다.
 * 두 코드 모두 서버 message를 그대로 보존해야 화면 안내가 뒤바뀌지 않는다 — 02-architect §8-3.
 */
describe('lib/api/guests — import 계열 에러 코드 분기(파일 손상·암호 보호 message 보존)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('previewImport — 400 IMPORT_FILE_UNREADABLE은 서버 message를 보존한 GuestImportFileUnreadableError로 던진다', async () => {
    const message =
      '엑셀 파일(.xlsx)이 아니거나 손상되어 열 수 없습니다 — CSV·PDF 등 다른 형식을 확장자만 바꿔 올린 경우에도 같은 안내가 나옵니다. 상단 [템플릿 받기]로 양식을 내려받아 그대로 채워 주세요.';
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: IMPORT_FILE_UNREADABLE, message } }, 400));

    try {
      await previewImport('evt-1', makeFile());
      expect.fail('previewImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(GuestImportFileUnreadableError);
      expect(err).not.toBeInstanceOf(GuestImportFilePasswordProtectedError);
      const unreadableError = err as GuestImportFileUnreadableError;
      expect(unreadableError.status).toBe(400);
      expect(unreadableError.message).toBe(message);
    }
  });

  it('confirmImport — 동일 400 IMPORT_FILE_UNREADABLE도 message를 보존한다(공용 파싱 경로 대칭)', async () => {
    const message =
      '엑셀 파일(.xlsx)이 아니거나 손상되어 열 수 없습니다 — CSV·PDF 등 다른 형식을 확장자만 바꿔 올린 경우에도 같은 안내가 나옵니다. 상단 [템플릿 받기]로 양식을 내려받아 그대로 채워 주세요.';
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: IMPORT_FILE_UNREADABLE, message } }, 400));

    try {
      await confirmImport('evt-1', makeFile());
      expect.fail('confirmImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(GuestImportFileUnreadableError);
      expect((err as GuestImportFileUnreadableError).status).toBe(400);
      expect((err as Error).message).toBe(message);
    }
  });

  it('previewImport — 400 IMPORT_FILE_PASSWORD_PROTECTED는 서버 message를 보존한 GuestImportFilePasswordProtectedError로 던진다', async () => {
    const message = '암호가 설정된 엑셀 파일은 열 수 없습니다 — 엑셀에서 암호를 해제한 뒤 다시 올려 주세요.';
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: IMPORT_FILE_PASSWORD_PROTECTED, message } }, 400),
    );

    try {
      await previewImport('evt-1', makeFile());
      expect.fail('previewImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(GuestImportFilePasswordProtectedError);
      expect(err).not.toBeInstanceOf(GuestImportFileUnreadableError);
      const passwordError = err as GuestImportFilePasswordProtectedError;
      expect(passwordError.status).toBe(400);
      expect(passwordError.message).toBe(message);
    }
  });

  it('confirmImport — 동일 400 IMPORT_FILE_PASSWORD_PROTECTED도 message를 보존한다(공용 파싱 경로 대칭)', async () => {
    const message = '암호가 설정된 엑셀 파일은 열 수 없습니다 — 엑셀에서 암호를 해제한 뒤 다시 올려 주세요.';
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: IMPORT_FILE_PASSWORD_PROTECTED, message } }, 400),
    );

    try {
      await confirmImport('evt-1', makeFile());
      expect.fail('confirmImport가 던지지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(GuestImportFilePasswordProtectedError);
      expect((err as GuestImportFilePasswordProtectedError).status).toBe(400);
      expect((err as Error).message).toBe(message);
    }
  });
});
