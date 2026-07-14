'use client';

import { useMutation } from '@tanstack/react-query';
import { downloadStatsExcel } from '@/lib/api/stats';
import { ConsoleApiError } from '@/lib/api/console';

// 서버 고정 파일명과 동일값(클라 동적 조립 없음 — qrZip과 달리 행사·구획별 이름표가 불필요해 단순화).
const STATS_EXCEL_FILENAME = '행사통계.xlsx';
// application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 의 distinctive 부분만 대조.
const XLSX_CONTENT_TYPE = 'spreadsheetml.sheet';

// export — 컴포넌트 렌더 없이 Content-Type 가드 로직만 단위 테스트하기 위함(useStatsExcel.test.ts).
export async function triggerStatsExcelDownload(eid: string): Promise<void> {
  const res = await downloadStatsExcel(eid);
  const contentType = res.headers.get('Content-Type') ?? '';
  // 401 등: 프록시가 JSON을 반환하므로 xlsx로 저장하지 않고 에러로 승격한다.
  // ok + xlsx MIME일 때만 다운로드를 진행한다(triggerZipDownload와 동일 계약).
  if (!res.ok || !contentType.includes(XLSX_CONTENT_TYPE)) {
    throw new ConsoleApiError(res.status, 'STATS_EXCEL_DOWNLOAD_FAILED');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = STATS_EXCEL_FILENAME; // 고정 파일명 — Content-Disposition RFC5987 파싱 회피(qrZip 규칙 동일)
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url); // 항상 해제(누수 방지)
  }
}

export function useStatsExcel(eid: string) {
  return useMutation({ mutationFn: () => triggerStatsExcelDownload(eid) });
}
