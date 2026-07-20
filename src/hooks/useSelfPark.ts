'use client';

import { useMutation } from '@tanstack/react-query';
import { selfPark } from '@/lib/api/visitor';
import type { RecordRegisterRequest } from '@/types/visitor';

export function useSelfPark(slotCode: string) {
  return useMutation({
    mutationFn: (request: RecordRegisterRequest) => selfPark(slotCode, request),
  });
}
