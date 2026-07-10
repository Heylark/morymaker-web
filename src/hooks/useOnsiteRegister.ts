'use client';

import { useMutation } from '@tanstack/react-query';
import { registerOnsite } from '@/lib/api/visitor';
import type { OnsiteRegisterRequest } from '@/types/visitor';

export function useOnsiteRegister(eventCode: string) {
  return useMutation({
    mutationFn: (request: OnsiteRegisterRequest) => registerOnsite(eventCode, request),
  });
}
