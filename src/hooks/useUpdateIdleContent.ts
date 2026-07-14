'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateIdleContent } from '@/lib/api/idle-contents';
import type { IdleContentUpdateRequest } from '@/types/idle-content';

interface UpdateIdleContentVars {
  cid: string;
  request: IdleContentUpdateRequest;
}

/** cid를 훅 생성 시점이 아닌 mutate 호출 시 변수로 받는다 — useUpdateSeatGroup과 동일 이유
 * (목록 한 화면에 콘텐츠가 여러 개라 항목마다 훅을 새로 만들 필요가 없다). */
export function useUpdateIdleContent(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cid, request }: UpdateIdleContentVars) => updateIdleContent(eid, cid, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'idleContents', eid] }),
  });
}
