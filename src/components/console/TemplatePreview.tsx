'use client';

import { useState } from 'react';
import { useGuests } from '@/hooks/useGuests';
import { useSmsPreview } from '@/hooks/useSmsPreview';

interface TemplatePreviewProps {
  eid: string;
}

/**
 * gid 단위 치환 미리보기(사실 H) — 대상 게스트를 선택하면 서버 `POST .../sms-template/preview`가
 * 반환한 `rendered` 문자열을 그대로 표시한다. 이름 문자열 매칭이 아니라 gid로 서버가 확정한
 * 대상이라 동명이인 오발송 걱정 없이 정확히 그 참석자의 데이터로 렌더된다 — 클라 재조합 금지.
 */
export function TemplatePreview({ eid }: TemplatePreviewProps) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const { data: guestList } = useGuests(eid);
  const { data: preview, isLoading, isError } = useSmsPreview(eid, guestId);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4">
      <h3 className="text-desk font-semibold text-ink">미리보기</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">대상 참석자</span>
        <select
          value={guestId ?? ''}
          onChange={(e) => setGuestId(e.target.value || null)}
          className="min-h-touch rounded-card border border-line px-4 text-desk"
        >
          <option value="">선택하세요</option>
          {guestList?.items.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {guest.name}
              {guest.org ? ` (${guest.org})` : ''}
            </option>
          ))}
        </select>
      </label>

      {!guestId && <p className="text-sm text-ink-muted">참석자를 선택하면 실제 발송될 문구가 보입니다.</p>}
      {guestId && isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {guestId && isError && <p className="text-danger">미리보기를 불러오지 못했습니다.</p>}
      {preview && (
        <div className="whitespace-pre-wrap rounded-card border border-line-soft bg-surface-sunken p-4 text-desk text-ink">
          {preview.rendered}
        </div>
      )}
    </div>
  );
}
