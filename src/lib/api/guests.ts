import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import { ConsoleApiError } from './console';
import type {
  GuestResponse,
  GuestCreateRequest,
  GuestUpdateRequest,
  GuestListResult,
  GuestSearchFilters,
  GuestImportPreviewResponse,
  GuestImportResultResponse,
} from '@/types/guest';

const guestsBase = (eid: string) => `api/events/${eid}/guests`;
// trailing slash 없음 — next.config에 trailingSlash 미설정(console.ts 패턴 계승).

/** 업로드 양식(머리글) 계약 불일치 — 서버가 내려주는 전용 에러 코드(공통 에러 봉투의 error.code). */
export const IMPORT_HEADER_MISMATCH = 'IMPORT_HEADER_MISMATCH';

/** 업로드 파일을 엑셀로 열 수 없음 — 서버가 내려주는 전용 에러 코드(공통 에러 봉투의 error.code). */
export const IMPORT_FILE_UNREADABLE = 'IMPORT_FILE_UNREADABLE';

/** 업로드 엑셀에 열기 암호가 걸림 — 손상과 안내가 달라 코드를 분리한다. */
export const IMPORT_FILE_PASSWORD_PROTECTED = 'IMPORT_FILE_PASSWORD_PROTECTED';

/**
 * 업로드 엑셀 0행 머리글이 업로드 양식과 다름 — 어긋난 칸 안내를 서버 message 그대로 보존해
 * 노출하기 위해 ConsoleApiError와 분리한다(ConsoleApiError.message는 "콘솔 API 요청 실패
 * (status code)" 고정 포맷이라 서버가 조립한 안내 문구를 담지 못한다).
 */
export class GuestImportHeaderMismatchError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GuestImportHeaderMismatchError';
  }
}

/**
 * 업로드한 파일이 엑셀이 아니거나 손상됨 — 머리글 불일치와 같은 이유로 ConsoleApiError와 분리한다
 * (ConsoleApiError.message는 고정 포맷이라 서버가 조립한 안내 문구를 담지 못한다).
 */
export class GuestImportFileUnreadableError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GuestImportFileUnreadableError';
  }
}

/** 업로드한 엑셀에 열기 암호가 걸림 — 해결 방법이 손상과 달라(암호 해제) 타입을 나눈다. */
export class GuestImportFilePasswordProtectedError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GuestImportFilePasswordProtectedError';
  }
}

interface ImportApiErrorBody {
  error: { code: string; message: string };
}

/**
 * import 계열(previewImport/confirmImport) 전용 에러 변환. 공유 `throwOnError`(console-http.ts)는
 * message를 버려 헤더 불일치 안내 문구가 사라지므로 여기서만 분기한다. `Response.json()`은 1회
 * 소비이므로 본문을 읽은 뒤 `throwOnError`를 재호출할 수 없다 — 여기서 직접 던진다.
 */
async function throwOnImportError(res: Response): Promise<never> {
  const body: ImportApiErrorBody | null = await res.json().catch(() => null);
  const code = body?.error?.code ?? 'UNKNOWN_ERROR';
  if (code === IMPORT_HEADER_MISMATCH) {
    throw new GuestImportHeaderMismatchError(res.status, body?.error?.message ?? '엑셀 머리글을 확인해 주세요.');
  }
  if (code === IMPORT_FILE_UNREADABLE) {
    throw new GuestImportFileUnreadableError(res.status, body?.error?.message ?? '엑셀 파일을 열 수 없습니다.');
  }
  if (code === IMPORT_FILE_PASSWORD_PROTECTED) {
    throw new GuestImportFilePasswordProtectedError(
      res.status,
      body?.error?.message ?? '엑셀 파일의 암호를 해제한 뒤 다시 올려 주세요.',
    );
  }
  throw new ConsoleApiError(res.status, code);
}

/**
 * VIP 행사 특성상(참석자 수 통상 수백 이내) 페이지네이션 UI를 도입하지 않고 넉넉한 단일
 * size로 사실상 전체를 한 번에 로드한다(02-architect §5-1). 필터(q/status/src/includeCancelled)는
 * 항상 서버 파라미터로 전달 — searchState 3상태 계산이 서버 책임이라 클라 재필터는 금지.
 */
export const ROSTER_PAGE_SIZE = 500;

export async function listGuests(eid: string, filters: GuestSearchFilters = {}): Promise<GuestListResult> {
  const params = new URLSearchParams({ page: '1', size: String(ROSTER_PAGE_SIZE) });
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.src) params.set('src', filters.src);
  if (filters.includeCancelled) params.set('includeCancelled', 'true');

  const res = await proxyFetch(`${guestsBase(eid)}?${params.toString()}`);
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse[]; meta?: { total?: number; searchState?: string; page?: number; size?: number } } =
    await res.json();
  return {
    items: body.data,
    total: body.meta?.total ?? body.data.length,
    searchState: (body.meta?.searchState as GuestListResult['searchState']) ?? null,
  };
}

export async function createGuest(eid: string, request: GuestCreateRequest): Promise<GuestResponse> {
  const res = await proxyFetch(guestsBase(eid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

export async function updateGuest(eid: string, gid: string, request: GuestUpdateRequest): Promise<GuestResponse> {
  const res = await proxyFetch(`${guestsBase(eid)}/${gid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

/**
 * 명단 제외(취소) — 하드 삭제 아님(status→취소 전이, 행 보존). `deleteSmsLog`는 항상 false로
 * 고정 전송한다(콘솔 UI가 이 파라미터를 토글로 노출하지 않음 — 이력 오삭제 방지 안전 기본값).
 */
export async function cancelGuest(eid: string, gid: string, deleteSmsLog = false): Promise<GuestResponse> {
  const res = await proxyFetch(`${guestsBase(eid)}/${gid}?deleteSmsLog=${deleteSmsLog}`, { method: 'DELETE' });
  if (!res.ok) return throwOnError(res);
  const body: { data: GuestResponse } = await res.json();
  return body.data;
}

export async function previewImport(eid: string, file: File): Promise<GuestImportPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type 헤더 직접 설정 금지 — 브라우저가 boundary 포함해 자동 설정(react.md §6).
  const res = await proxyFetch(`${guestsBase(eid)}/import/preview`, { method: 'POST', body: formData });
  if (!res.ok) return throwOnImportError(res);
  const body: { data: GuestImportPreviewResponse } = await res.json();
  return body.data;
}

/** confirmImport는 preview 토큰을 재사용하지 않고 파일을 다시 받아 재파싱한다 — 동일 File 재사용 필수. */
export async function confirmImport(eid: string, file: File): Promise<GuestImportResultResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await proxyFetch(`${guestsBase(eid)}/import`, { method: 'POST', body: formData });
  if (!res.ok) return throwOnImportError(res);
  const body: { data: GuestImportResultResponse } = await res.json();
  return body.data;
}

/**
 * 업로드 양식(.xlsx) 다운로드 — 서버가 컬럼 계약(파서와 동일 정의)에서 생성한 고정 바이트를
 * 반환한다(행사별 데이터 없음). raw Response를 그대로 반환해 소비 측(useImportTemplate)이
 * Content-Type을 확인해 JSON 에러를 xlsx로 저장하지 않게 막는다(downloadStatsExcel과 동일 계약).
 */
export function downloadImportTemplate(eid: string): Promise<Response> {
  return proxyFetch(`${guestsBase(eid)}/import/template`);
}
