'use client';

import { useQuery } from '@tanstack/react-query';
import { listParkingRecords, type ParkingRecordFilters } from '@/lib/api/staff';

export function useParkingRecords(eid: string, filters: ParkingRecordFilters = {}) {
  return useQuery({
    queryKey: ['staff', 'parking-records', eid, filters],
    queryFn: () => listParkingRecords(eid, filters),
  });
}
