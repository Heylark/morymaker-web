'use client';

import Link from 'next/link';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountList } from '@/components/console/AccountList';

/**
 * ADM-11 — 계정·권한 목록. `/accounts`는 [eid] 컨텍스트 밖 시스템 레벨이라 EventConsoleShell을
 * 쓰지 않고 `events/page.tsx`처럼 독립 `<main>`으로 렌더한다(-03 병렬 세션이 접촉하는 셸 컴포넌트를
 * 건드리지 않기 위함).
 */
export default function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-surface-sunken p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-desk-lg font-semibold text-ink">계정 관리</h1>
        <Link
          href="/accounts/new"
          className="min-h-touch flex items-center rounded-card bg-primary px-4 text-sm font-semibold text-primary-ink"
        >
          + 계정 추가
        </Link>
      </div>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">계정 목록을 불러오지 못했습니다.</p>}
      {accounts && <AccountList accounts={accounts} />}
    </main>
  );
}
