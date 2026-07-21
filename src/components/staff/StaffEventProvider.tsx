'use client';

import Link from 'next/link';
import { createContext, useEffect, useState } from 'react';
import { BASE_PATH } from '@/lib/base-path';

export type StaffEventState =
  | { status: 'loading' }
  | { status: 'ready'; eid: string }
  | { status: 'empty' }
  | { status: 'unsupported' };

export interface StaffEventContextValue {
  eid: string;
}

export const StaffEventContext = createContext<StaffEventContextValue | null>(null);

interface MeResponse {
  user: { username: string; roles: string[]; eventIds: string[] | null } | null;
}

/**
 * 실행자 세션의 현재 행사(eid) 컨텍스트 — 역할 게이트(useRequireStaff)와 상보·독립으로 동작한다
 * (역할 게이트는 eid를 판정하지 않는다. 이 Provider가 마운트되는 시점엔 서버 게이트를 이미
 * 통과했다는 전제다). `/api/auth/me`의 eventIds 3-값 의미론에 따라 분기한다:
 *   부재(null)  = SYSTEM_ADMIN(전체 허용) — 행사명 조회가 admin 전용이라 라벨 없는 피커는
 *                 비실용적이라 1차는 피커 없이 defer 안내로 수렴한다(YAGNI).
 *   빈 배열([]) = 배정된 행사 0건 — 안내 상태.
 *   길이 1      = 자동 선택(morymaker 현재 운영 현실의 주 경로) — children을 렌더한다.
 *   길이 2+     = 다중 배정도 라벨 조회 불가 사유로 1차 defer.
 *
 * 데이터 훅(useLookup 등)은 eid가 확정된 뒤에만 마운트되도록, ready 상태가 아니면 children을
 * 렌더하지 않고 이 컴포넌트가 안내 UI로 대신한다 — 별도 `enabled` 플래그를 각 훅에 반복하지 않는다.
 */
export function StaffEventProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StaffEventState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    // 브라우저 fetch는 basePath를 자동으로 붙이지 않는다 — 명시 접두 필수(경계 지점).
    fetch(`${BASE_PATH}/api/auth/me`, { signal: controller.signal })
      .then((r) => r.json())
      .then((body: MeResponse) => {
        const eventIds = body.user?.eventIds ?? null;
        if (eventIds === null) {
          setState({ status: 'unsupported' });
        } else if (eventIds.length === 0) {
          setState({ status: 'empty' });
        } else if (eventIds.length === 1) {
          setState({ status: 'ready', eid: eventIds[0] });
        } else {
          setState({ status: 'unsupported' });
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // 조회 실패는 안내 상태로 안전 수렴한다 — 인증 만료 자체는 역할 게이트가 별도로 처리한다.
        setState({ status: 'empty' });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-sunken p-6 text-center">
        <p className="text-desk text-ink-muted">확인 중...</p>
        {/* 이 화면은 셸(사이드바·헤더·탭바) 밖이라 복귀 동선이 0개다 — /api/auth/me 응답이
            지연·중단되면 이 분기에 고정될 수 있어 empty·unsupported와 동일하게 안전망을
            둔다(ADR-029, 3분기 대칭). */}
        <Link href="/landing" className="text-desk text-[var(--champagne)] underline underline-offset-4">
          콘솔로 돌아가기
        </Link>
      </main>
    );
  }

  if (state.status === 'empty') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-sunken p-6 text-center">
        <p className="text-desk text-ink-muted">배정된 행사가 없습니다. 관리자에게 문의하세요.</p>
        {/* 이 화면은 셸(사이드바·헤더·탭바) 밖이라 복귀 동선이 0개다 — 직접 URL·북마크 도달
            대비 안전망(ADR-029). Zone2·랜딩이 이미 이 링크를 조건부로 감추므로 정상 경로로는
            도달하지 않는다. */}
        <Link href="/landing" className="text-desk text-[var(--champagne)] underline underline-offset-4">
          콘솔로 돌아가기
        </Link>
      </main>
    );
  }

  if (state.status === 'unsupported') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-sunken p-6 text-center">
        <p className="text-desk text-ink-muted">
          여러 행사에 배정되어 있거나 시스템 관리자 계정입니다. 이 화면은 아직 지원하지 않습니다 —
          관리자에게 문의하세요.
        </p>
        <Link href="/landing" className="text-desk text-[var(--champagne)] underline underline-offset-4">
          콘솔로 돌아가기
        </Link>
      </main>
    );
  }

  return <StaffEventContext.Provider value={{ eid: state.eid }}>{children}</StaffEventContext.Provider>;
}
