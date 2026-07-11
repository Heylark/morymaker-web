'use client';

import { useMutation } from '@tanstack/react-query';
import { checkin } from '@/lib/api/kiosk';

/** `useCheckin`(실행자)과 이름이 겹치지 않도록 `useKiosk*` 접두를 쓴다(훅 명명 충돌 회피, 설계 §1). */
export function useKioskCheckin(eid: string) {
  return useMutation({
    mutationFn: (guestId: string) => checkin(eid, guestId),
    retry: false,
  });
}
