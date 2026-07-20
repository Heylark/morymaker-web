import { ConsoleApiError } from './console';

/**
 * 명단·초대(guests·sms) 도메인 신규 파일 전용 공유 에러 헬퍼 — 먼저 만든 콘솔 기반(IA·셸)의
 * `console.ts`는 무접촉(동결 경계)이라 `throwOnError` 구현 자체는 이 파일에 별도로 둔다. `ConsoleApiError`는
 * `console.ts`의 기존 export를 재사용(재정의 아님) — 콘솔 전역에서 에러 타입은 하나로 유지.
 */
export { ConsoleApiError };

interface ApiErrorBody {
  error: { code: string; message: string; field?: string | null };
}

export async function throwOnError(res: Response): Promise<never> {
  const body: ApiErrorBody | null = await res.json().catch(() => null);
  throw new ConsoleApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR');
}
