'use client';

import { useQuery } from '@tanstack/react-query';
import { BASE_PATH } from '@/lib/base-path';

interface MeResponse {
  // eventIds는 3-값 의미론이다 — null=클레임 부재(SYSTEM_ADMIN 전체 허용) / []=배정 0건 /
  // string[]=배정 목록(`api/auth/me/route.ts`의 `extractEventIds`가 그대로 실어 보낸다).
  // `string[]`로 좁게 선언하면 SYSTEM_ADMIN 세션에서 `eventIds.length`가 null.length로
  // 런타임 TypeError를 낸다(StaffEventProvider.tsx는 이미 `string[] | null`로 올바르게 선언돼 있다).
  user: { username: string; roles: string[]; eventIds: string[] | null } | null;
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
      // 브라우저 fetch는 basePath를 자동으로 붙이지 않는다 — 명시 접두 필수(경계 지점).
      const res = await fetch(`${BASE_PATH}/api/auth/me`);
      return res.json();
    },
  });
}
