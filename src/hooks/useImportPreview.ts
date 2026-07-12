'use client';

import { useMutation } from '@tanstack/react-query';
import { previewImport } from '@/lib/api/guests';

/** 읽기전용 미리보기 — DB에 부작용이 없어 invalidate 대상 쿼리가 없다. */
export function useImportPreview(eid: string) {
  return useMutation({
    mutationFn: (file: File) => previewImport(eid, file),
  });
}
