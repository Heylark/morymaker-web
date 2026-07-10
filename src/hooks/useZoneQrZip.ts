'use client';

import { useMutation } from '@tanstack/react-query';
import { downloadZoneQrZip, ConsoleApiError } from '@/lib/api/console';

async function triggerZipDownload(eid: string, zid: string, zoneName: string): Promise<void> {
  const res = await downloadZoneQrZip(eid, zid);
  const contentType = res.headers.get('Content-Type') ?? '';
  // 401 등: 프록시가 JSON을 반환하므로 zip으로 저장하지 않고 에러로 승격한다.
  // ok + application/zip일 때만 다운로드를 진행한다.
  if (!res.ok || !contentType.includes('application/zip')) {
    throw new ConsoleApiError(res.status, 'QR_ZIP_DOWNLOAD_FAILED');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${zoneName}_QR.zip`; // 파일명 자체 조립 — 서버 Content-Disposition의 RFC5987 헤더 파싱을 회피(서버와 동일 규칙)
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url); // 항상 해제(누수 방지)
  }
}

export function useZoneQrZip(eid: string) {
  return useMutation({
    mutationFn: ({ zid, zoneName }: { zid: string; zoneName: string }) => triggerZipDownload(eid, zid, zoneName),
  });
}
