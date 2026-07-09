'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_ROLES = ['SYSTEM_ADMIN', 'EVENT_ADMIN'];

interface UseRequireAdminResult {
  isAdmin: boolean;
  loading: boolean;
}

/**
 * 클라 반응형 게이트(2차) — SPA 네비게이션 중 세션 만료를 감지한다.
 * 서버 layout 게이트(1차, RSC)는 초기 진입만 차단하므로 이 훅이 상보 역할을 한다.
 */
export function useRequireAdmin(): UseRequireAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { user: { username: string; roles: string[] } | null }) => {
        const roles = d.user?.roles ?? [];
        if (!d.user || !roles.some((r) => ADMIN_ROLES.includes(r))) {
          router.replace('/oauth/login');
          return;
        }
        setIsAdmin(true);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // 언마운트로 인한 중단은 무시
        router.replace('/oauth/login');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  return { isAdmin, loading };
}
