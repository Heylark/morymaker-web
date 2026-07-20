'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerParking } from '@/lib/api/staff';
import type { RegisterParkingRequest } from '@/types/staff';

export function useRegisterParking(eid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RegisterParkingRequest) => registerParking(eid, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'parking-records', eid] });
    },
  });
}
