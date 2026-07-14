'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccount } from '@/lib/api/accounts';
import type { AccountUpdateRequest } from '@/types/account';

interface UpdateAccountVars {
  id: string;
  request: AccountUpdateRequest;
}

/**
 * id를 훅 생성 시점이 아닌 mutate 호출 시 변수로 받는다 — 목록 한 화면에 계정이 여럿이라
 * 행마다 훅을 새로 만들 필요가 없다(useUpdateGuest 패턴 재사용).
 */
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: UpdateAccountVars) => updateAccount(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'accounts'] }),
  });
}
