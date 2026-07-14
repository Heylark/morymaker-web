'use client';

import { AccountForm } from '@/components/console/AccountForm';

// 시스템 레벨(eid 컨텍스트 없음) — 생성 성공 시 AccountForm이 자체 확인 화면으로 전환한다.
export default function NewAccountPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">계정 추가</h1>
      <AccountForm />
    </main>
  );
}
