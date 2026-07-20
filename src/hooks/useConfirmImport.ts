'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmImport } from '@/lib/api/guests';

/** 확정 임포트 — 명단이 변동되므로 목록뿐 아니라 발송 게이트(candidates/blocked)도 재계산 필요. */
export function useConfirmImport(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => confirmImport(eid, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'guests', eid] });
      qc.invalidateQueries({ queryKey: ['console', 'sms-gate', eid] });
    },
  });
}
