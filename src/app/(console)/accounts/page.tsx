'use client';

import { useAccounts } from '@/hooks/useAccounts';
import { AccountList } from '@/components/console/AccountList';

/**
 * ADM-11 — 계정·권한 목록. `/accounts`는 [eid] 컨텍스트 밖 시스템 레벨이라 `EventScopeGate`를
 * 쓰지 않는다. 제목·"+ 계정 추가" CTA는 `ShellHeader`가 라우트 레지스트리로 파생하므로 이
 * 파일은 본문만 소유한다. `<main>`은 상위 `ConsoleShell` 소유라 `<div>`로 강등해 폭·세로
 * 리듬만 스스로 소유한다(ADR-025).
 */
export default function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">계정 목록을 불러오지 못했습니다.</p>}
      {accounts && <AccountList accounts={accounts} />}
    </div>
  );
}
