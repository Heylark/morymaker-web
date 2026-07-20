'use client';

import { EventForm } from '@/components/console/EventForm';

// 셸 밖(eid 컨텍스트가 아직 없는 시점) — 생성 성공 시 EventForm이 /events로 이동시킨다.
export default function NewEventPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 bg-surface-sunken p-6">
      <h1 className="text-desk-lg font-semibold text-ink">새 행사 만들기</h1>
      <EventForm />
    </main>
  );
}
