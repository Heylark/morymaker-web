'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccountStatus } from '@/lib/api/accounts';

interface UpdateAccountStatusVars {
  id: string;
  status: string;
}

export function useUpdateAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: UpdateAccountStatusVars) => updateAccountStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'accounts'] }),
  });
}
