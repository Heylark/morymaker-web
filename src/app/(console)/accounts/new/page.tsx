'use client';

import { AccountForm } from '@/components/console/AccountForm';

// 시스템 레벨(eid 컨텍스트 없음) — 생성 성공 시 AccountForm이 자체 확인 화면으로 전환한다.
// <main>은 상위 ConsoleShell 소유라 이 파일은 <div>로 강등해 폭만 스스로 소유한다.
export default function NewAccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <AccountForm />
    </div>
  );
}
