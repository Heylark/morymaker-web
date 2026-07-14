import { proxyFetch } from '@/lib/proxy-fetch';
import { throwOnError } from './console-http';
import type { StatsResponse } from '@/types/stats';

/**
 * 행사 현황·통계(ADM-03) 도메인 신규 파일 — `lib/api/console.ts`(IA·셸 기반)는 동결 경계라
 * 무접촉 원칙을 지키기 위해 `accounts.ts`/`guests.ts`와 동일하게 `console-http.ts`의 공유
 * `throwOnError`를 재사용한다(`ConsoleApiError` 타입은 콘솔 전역에서 하나로 유지).
 */

const statsBase = (eid: string) => `api/events/${eid}/stats`;
// trailing slash 없음 — console.ts/seats.ts와 동일 규약(3분법 PRIVATE 판정 정합).

export async function getStats(eid: string): Promise<StatsResponse> {
  const res = await proxyFetch(statsBase(eid));
  if (!res.ok) return throwOnError(res);
  const body: { data: StatsResponse } = await res.json();
  return body.data;
}

/**
 * Excel 일괄 다운로드 — 서버가 xlsx 바이너리를 생성한다(web은 생성하지 않음). raw Response를
 * 그대로 반환해 소비 측(useStatsExcel)이 Content-Type을 확인해 JSON 에러를 xlsx로 저장하지
 * 않게 막는다(downloadZoneQrZip과 동일 계약). `refresh` 쿼리 파라미터는 no-op이라 미사용.
 */
export function downloadStatsExcel(eid: string): Promise<Response> {
  return proxyFetch(`${statsBase(eid)}/export`);
}
