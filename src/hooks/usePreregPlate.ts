'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { preregPlate } from '@/lib/api/visitor';
import type { PublicHub } from '@/types/visitor';

/**
 * 사전등록 응답이 `{plate,message}`만 반환(허브 전체 미반환)하므로, 성공 시 캐시된 허브에
 * 변경 필드만 병합한다(GET 재조회 회피 — 응답이 plate 필드의 authoritative 값이다).
 * 캐시가 없는 edge(직접 mutate 등)는 no-op — 다음 자연 refetch가 정합을 맞춘다.
 */
export function usePreregPlate(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plate: string) => preregPlate(token, plate),
    onSuccess: (data) => {
      queryClient.setQueryData<PublicHub>(['visitor', 'hub', token], (old) =>
        old ? { ...old, prereg: { plateRegistered: true, plate: data.plate } } : old,
      );
    },
  });
}
