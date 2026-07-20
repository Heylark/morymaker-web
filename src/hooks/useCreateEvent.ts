'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from '@/lib/api/console';
import type { EventCreateRequest } from '@/types/console';

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EventCreateRequest) => createEvent(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['console', 'events'] }),
  });
}
