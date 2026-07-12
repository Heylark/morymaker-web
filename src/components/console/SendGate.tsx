'use client';

import { useState } from 'react';
import { useSmsGate } from '@/hooks/useSmsGate';
import { useSendSms } from '@/hooks/useSendSms';
import { ConfirmDialog } from './ConfirmDialog';

interface SendGateProps {
  eid: string;
}

/**
 * 발송 검증 게이트 — [발송] 버튼 활성은 서버 `canSend`에 직결한다(클라 재계산 금지, ADR-003 —
 * 구조적 누락 차단). `appliedTemplate===''`(템플릿 미설정)이면 별도로 추가 비활성 + 안내
 * 문구를 보여준다(서버 `send`가 이 상태에서 `NoSuchElementException`을 던지므로 UI가 먼저 막는다).
 */
export function SendGate({ eid }: SendGateProps) {
  const [excludeAlreadySent, setExcludeAlreadySent] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: gate, isLoading, isError } = useSmsGate(eid, excludeAlreadySent);
  const sendMutation = useSendSms(eid);

  const templateMissing = gate?.appliedTemplate === '';
  const canSend = !!gate?.canSend && !templateMissing;

  const handleConfirm = async () => {
    await sendMutation.mutateAsync({ excludeAlreadySent, confirm: true });
    setConfirmOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4">
      <h3 className="text-desk font-semibold text-ink">초대 문자 발송</h3>

      {isLoading && <p className="text-ink-muted">발송 대상 확인 중...</p>}
      {isError && <p className="text-danger">발송 게이트를 확인하지 못했습니다.</p>}

      {gate && (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
            <span>발송 대상 {gate.candidates}명</span>
            <span>이미 발송 {gate.alreadySent}명</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={excludeAlreadySent}
                onChange={(e) => setExcludeAlreadySent(e.target.checked)}
                className="h-5 w-5"
              />
              이미 발송 {gate.alreadySent}명 제외
            </label>
          </div>

          {gate.blocked.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-danger">누락 정보로 발송 불가 {gate.blocked.length}명</p>
              <ul className="flex flex-col gap-1 text-sm text-ink-muted">
                {gate.blocked.map((b) => (
                  <li key={b.guestId}>
                    {b.name} — {b.missing.join(', ')} 없음
                  </li>
                ))}
              </ul>
            </div>
          )}

          {templateMissing && (
            <p className="text-sm text-danger">템플릿을 먼저 작성하세요 (초대 문자 템플릿 탭).</p>
          )}

          <button
            type="button"
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
            className="min-h-touch w-fit rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
          >
            발송
          </button>
          {sendMutation.isSuccess && sendMutation.data && (
            <p className="text-sm text-ink">
              발송 완료 — 성공 {sendMutation.data.sent}건 · 실패 {sendMutation.data.failed}건
            </p>
          )}
          {sendMutation.isError && <p className="text-sm text-danger">발송 중 오류가 발생했습니다.</p>}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="초대 문자 발송"
        message={gate ? `${gate.candidates}명에게 초대 문자를 발송할까요?` : ''}
        confirmLabel="발송"
        pending={sendMutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
