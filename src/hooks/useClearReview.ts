'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearReview } from '@/lib/api/staff';

export function useClearReview(eid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clearReview(eid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'parking-records', eid] });
    },
  });
}
