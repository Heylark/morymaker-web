'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount } from '@/lib/api/accounts';
import type { AccountCreateRequest } from '@/types/account';

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AccountCreateRequest) => createAccount(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'accounts'] }),
  });
}
