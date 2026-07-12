'use client';

import { useState } from 'react';
import { useZoneSlots } from '@/hooks/useZoneSlots';
import { SlotAutoLabel } from '@/components/shared/SlotAutoLabel';
import { QrGlowBox } from '@/components/shared/QrGlowBox';
import { QrPreview } from './QrPreview';
import { ZoneQrZipButton } from './ZoneQrZipButton';
import type { ZoneResponse } from '@/types/console';

interface SlotQrGridProps {
  eid: string;
  zone: ZoneResponse;
}

/** 자리별 QR 미리보기 그리드 — 패널이 열릴 때만 자리 목록을 조회한다(선제 호출 회피). */
export function SlotQrGrid({ eid, zone }: SlotQrGridProps) {
  const [open, setOpen] = useState(false);
  const { data: slots, isLoading, isError } = useZoneSlots(eid, zone.id, open);

  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="text-desk font-semibold text-ink">자리 QR</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-h-touch rounded-card border border-black/10 px-4 text-sm font-medium text-ink"
        >
          {open ? 'QR 미리보기 닫기' : 'QR 미리보기 열기'}
        </button>
      </div>

      {open && isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {open && isError && <p className="text-danger">자리 QR을 불러오지 못했습니다.</p>}
      {open && slots && (
        // 375px에서 기본 2열이면 카드 두 개가 좁은 폭을 나눠 오버플로했다 — 1열을 기본으로 하고
        // sm(640px+) 이상에서만 다열로 넓힌다.
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {slots.map((slot) => (
            // url은 slot.scanUrl 그대로(서버 조립) — env base + slotCode 문자열 결합 절대 금지
            <div
              key={slot.slotCode}
              // sm 미만(모바일 1열)에서만 폭을 좁혀 가운데 정렬한다 — sm 이상은 기존
              // 다열 그리드에서 컬럼 폭을 그대로 채우던 모양을 그대로 유지(회귀 0).
              className="mx-auto flex max-w-44 flex-col items-center gap-2 rounded-card border border-black/10 p-3 sm:mx-0 sm:max-w-none"
            >
              {/* 그리드에 자리 수만큼 QR이 동시에 나열되므로 발광은 끈다(화면당 발광 예산 1) —
                  scan성은 QrPreview의 원시 흑백 렌더가 그대로 담당 */}
              <QrGlowBox glow={false}>
                <QrPreview url={slot.scanUrl} size={140} />
              </QrGlowBox>
              <SlotAutoLabel fullName={slot.slotFullName} />
            </div>
          ))}
        </div>
      )}

      <ZoneQrZipButton eid={eid} zid={zone.id} zoneName={zone.zoneName} />
    </section>
  );
}
