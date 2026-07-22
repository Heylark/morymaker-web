'use client';

import { useMutation } from '@tanstack/react-query';
import { downloadImportTemplate } from '@/lib/api/guests';
import { ConsoleApiError } from '@/lib/api/console';

// 서버 고정 파일명과 동일값(행사명을 넣지 않는다 — 템플릿에 행사 데이터가 없어 개인화 이유가 없음).
const IMPORT_TEMPLATE_FILENAME = '명단업로드양식.xlsx';
// application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 의 distinctive 부분만 대조.
const XLSX_CONTENT_TYPE = 'spreadsheetml.sheet';

// export — 컴포넌트 렌더 없이 Content-Type 가드 로직만 단위 테스트하기 위함(useImportTemplate.test.ts).
export async function triggerImportTemplateDownload(eid: string): Promise<void> {
  const res = await downloadImportTemplate(eid);
  const contentType = res.headers.get('Content-Type') ?? '';
  // 401 등: 프록시가 JSON을 반환하므로 xlsx로 저장하지 않고 에러로 승격한다.
  // ok + xlsx MIME일 때만 다운로드를 진행한다(triggerStatsExcelDownload와 동일 계약).
  if (!res.ok || !contentType.includes(XLSX_CONTENT_TYPE)) {
    throw new ConsoleApiError(res.status, 'IMPORT_TEMPLATE_DOWNLOAD_FAILED');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = IMPORT_TEMPLATE_FILENAME; // 고정 파일명 — Content-Disposition RFC5987 파싱 회피(statsExcel 규칙 동일)
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url); // 항상 해제(누수 방지)
  }
}

export function useImportTemplate(eid: string) {
  return useMutation({ mutationFn: () => triggerImportTemplateDownload(eid) });
}
