'use client';

import { useQuery } from '@tanstack/react-query';

interface MeResponse {
  user: { username: string; roles: string[]; eventIds: string[] } | null;
}

/**
 * nav 조건부 링크(계정 관리)용 — `useRequireRole`과 달리 리다이렉트하지 않는다. 세션이 없거나
 * 역할이 부족해도 그냥 링크를 숨기기만 하면 되는 화면 장식용 조회라 게이트 역할까지 겸하지 않는다
 * (실제 접근 차단은 `/accounts` 자체의 서버·클라 이중 게이트 + auth 403이 담당).
 */
export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<MeResponse> => {
      const res = await fetch('/api/auth/me');
      return res.json();
    },
  });
}
