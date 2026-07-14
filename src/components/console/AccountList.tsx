'use client';

import { useState } from 'react';
import { useUpdateAccountStatus } from '@/hooks/useUpdateAccountStatus';
import { AccountEditModal } from './AccountEditModal';
import { ConfirmDialog } from './ConfirmDialog';
import { StatePill } from '@/components/shared/StatePill';
import { accountRoleLabel, accountStatusTone } from '@/lib/account-constants';
import type { AccountResponse } from '@/types/account';

interface AccountListProps {
  accounts: AccountResponse[];
}

/**
 * 계정 목록 표현부 + 상태토글(ConfirmDialog) — 0건 빈 상태를 포함한다(EventList 미러). 데이터
 * 조회는 페이지가 useAccounts로 수행해 넘긴다. 편집 모달·상태토글 확인창은 이 컴포넌트가 소유한다
 * (RosterTable의 cancelTarget 패턴 — 대상 계정 자체를 state로 들고, null이면 닫힘).
 */
export function AccountList({ accounts }: AccountListProps) {
  const [editTarget, setEditTarget] = useState<AccountResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<AccountResponse | null>(null);
  const statusMutation = useUpdateAccountStatus();

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === '활성' ? '비활성' : '활성';
    await statusMutation.mutateAsync({ id: statusTarget.id, status: nextStatus });
    setStatusTarget(null);
  };

  if (accounts.length === 0) {
    return <p className="text-ink-muted">등록된 계정이 없습니다. 위쪽 [+ 계정 추가]로 첫 계정을 만들어보세요.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
          >
            {/*
              min-w-0 — 액션 칼럼을 flex-shrink-0로 고정한 뒤에는 이 칼럼이 줄어드는 쪽이 되는데, flex item 기본
              min-width:auto라 공백 없는 긴 이메일은 줄바꿈 대신 카드 밖으로 넘쳐 액션 버튼을 화면 밖으로 밀어낸다
              (min-w-0로 축소를 허용). break-words는 그 넘친 텍스트가 실제로 줄바꿈되게 한다.
              부모는 기본 stretch(items-start로 바꾸지 않음)를 유지해 이름·이메일 span이 컬럼 폭에 맞춰 줄바꿈되게
              하고, pill에만 self-start를 줘서 그것만 내용만큼만 차지하게 한다(형제 span까지 stretch를 끊으면
              긴 이메일이 컬럼 폭 제약을 잃고 액션 영역 위로 넘쳐 보인다 — 실측으로 발견한 함정).
            */}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-desk font-semibold text-ink">{account.name || account.email}</span>
              <span className="text-sm text-ink-muted break-words">
                {account.email} · {accountRoleLabel(account.role)}
              </span>
              <StatePill tone={accountStatusTone(account.status)} className="self-start">
                {account.status}
              </StatePill>
            </div>
            {/* flex-shrink-0 — 좁은 화면에서 이름·이메일 쪽이 먼저 줄어들게 하고 액션 폭은 고정해 글자 단위 줄바꿈을 막음 */}
            <div className="flex flex-shrink-0 gap-4">
              <button
                type="button"
                onClick={() => setEditTarget(account)}
                className="whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => setStatusTarget(account)}
                className="whitespace-nowrap text-sm font-medium text-primary"
              >
                {account.status === '활성' ? '비활성화' : '활성화'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <AccountEditModal open={editTarget !== null} account={editTarget ?? undefined} onClose={() => setEditTarget(null)} />

      <ConfirmDialog
        open={statusTarget !== null}
        title={statusTarget?.status === '활성' ? '계정 비활성화' : '계정 활성화'}
        message={
          statusTarget
            ? `"${statusTarget.name || statusTarget.email}" 계정을 ${statusTarget.status === '활성' ? '비활성화' : '활성화'}할까요?`
            : ''
        }
        confirmLabel={statusTarget?.status === '활성' ? '비활성화' : '활성화'}
        danger={statusTarget?.status === '활성'}
        pending={statusMutation.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </>
  );
}
