'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * TanStack Query 전역 마운트 — staff 표면의 첫 도입(REQ 설계 결정). 앱 루트에 걸어도
 * RQ 미사용 표면(console)에는 영향이 없다(inert) — console은 여전히 raw useState/useEffect
 * 페칭을 그대로 쓴다(이번 REQ에서 마이그레이션하지 않음).
 *
 * useState로 QueryClient를 감싸 컴포넌트 인스턴스당 1개만 생성한다 — 모듈 top-level에서
 * 생성하면 서버 렌더 요청 간에 캐시가 공유되어 사용자 간 데이터가 섞일 위험이 있다.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
