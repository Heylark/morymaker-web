'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutParking } from '@/lib/api/staff';

export function useCheckout(eid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkoutParking(eid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'parking-records', eid] });
    },
  });
}
