'use client';

import { useQuery } from '@tanstack/react-query';
import { listAccounts } from '@/lib/api/accounts';

export function useAccounts() {
  return useQuery({ queryKey: ['console', 'accounts'], queryFn: () => listAccounts() });
}
