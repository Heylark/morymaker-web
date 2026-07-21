'use client';

import { EventForm } from '@/components/console/EventForm';

// 셸 안(헤더가 "새 행사" 제목 + 뒤로가기를 렌더 — console-routes.ts) — 생성 성공 시 EventForm이
// /events로 이동시킨다. <main>은 상위 ConsoleShell 소유라 이 파일은 <div>로 강등해 폭만 스스로
// 소유한다(ADR-025).
export default function NewEventPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <EventForm />
    </div>
  );
}
