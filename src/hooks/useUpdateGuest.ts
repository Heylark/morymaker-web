'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGuest } from '@/lib/api/guests';
import type { GuestUpdateRequest } from '@/types/guest';

interface UpdateGuestVars {
  gid: string;
  request: GuestUpdateRequest;
}

/**
 * gid를 훅 생성 시점이 아닌 mutate 호출 시 변수로 받는다 — RosterTable 한 화면에 게스트가
 * 여러 명이라 ZoneForm(zid 고정) 패턴과 달리 행마다 훅을 새로 만들 필요가 없다.
 */
export function useUpdateGuest(eid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gid, request }: UpdateGuestVars) => updateGuest(eid, gid, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'guests', eid] }),
  });
}
