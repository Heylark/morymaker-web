'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FORBIDDEN_PATH, resolveGateOutcome } from '@/lib/roles';

interface UseRequireRoleResult {
  hasRole: boolean;
  loading: boolean;
}

/**
 * 클라 반응형 게이트(2차) 파라미터화 프리미티브 — SPA 네비게이션 중 세션 만료를 감지한다.
 * 서버 layout 게이트(1차, RSC)는 초기 진입만 차단하므로 이 훅이 상보 역할을 한다.
 *
 * (console)의 useRequireAdmin이 ADMIN_ROLES를 하드코딩하던 것을 role 목록 인자로 받게 추출한
 * 신규 프리미티브다 — console 자체(useRequireAdmin.ts)는 손대지 않는다(동작 보존, 회귀 0).
 * 소비자가 이미 2곳(console·staff) + 향후 표면 예정이라 파라미터화한다.
 *
 * 미인증과 인증+role불충족을 서버 게이트(auth-gate.ts)와 동일한 resolveGateOutcome로 구분한다
 * — 불충족을 로그인으로 보내면 재인증 후 같은 role로 돌아와 다시 차단되는 무한 리다이렉트가
 * 생긴다. 네트워크 오류(catch)는 세션 상태를 판정할 수 없어 기존대로 로그인으로 보수적으로
 * 처리한다(오분류로 정당한 사용자를 forbidden에 가두는 쪽보다 재로그인 요구가 안전하다).
 */
export function useRequireRole(roles: readonly string[]): UseRequireRoleResult {
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { user: { username: string; roles: string[] } | null }) => {
        const outcome = resolveGateOutcome(d.user?.roles ?? null, roles);
        if (outcome === 'UNAUTHENTICATED') {
          router.replace('/oauth/login');
          return;
        }
        if (outcome === 'FORBIDDEN') {
          router.replace(FORBIDDEN_PATH);
          return;
        }
        setHasRole(true);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // 언마운트로 인한 중단은 무시
        router.replace('/oauth/login');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // roles는 호출부가 모듈 top-level 상수(예: STAFF_ROLES)로 넘기는 안정 참조를 전제한다 —
    // 매 렌더 새 배열 리터럴을 넘기면 안 된다(재실행 방지를 위해 의도적으로 deps에서 제외).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { hasRole, loading };
}
