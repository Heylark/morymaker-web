'use client';

import { useState } from 'react';
import { useSmsLog } from '@/hooks/useSmsLog';
import { useResendSms } from '@/hooks/useResendSms';
import { ConfirmDialog } from './ConfirmDialog';
import { StatePill } from '@/components/shared/StatePill';
import { smsLogStatusTone } from '@/lib/console-constants';
import type { SmsLogResponse } from '@/types/sms';

interface SmsLogViewProps {
  eid: string;
}

/** 발송 이력 — 개별 재발송은 `guestId`가 남아있는 행(참석자가 삭제되지 않은 경우)에서만 가능하다. */
export function SmsLogView({ eid }: SmsLogViewProps) {
  const { data: logs, isLoading, isError } = useSmsLog(eid);
  const resendMutation = useResendSms(eid);
  const [resendTarget, setResendTarget] = useState<SmsLogResponse | null>(null);

  const handleConfirm = async () => {
    if (!resendTarget?.guestId) return;
    await resendMutation.mutateAsync({ guestId: resendTarget.guestId, confirm: true });
    setResendTarget(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4">
      <h3 className="text-desk font-semibold text-ink">발송 이력</h3>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">발송 이력을 불러오지 못했습니다.</p>}
      {logs && logs.length === 0 && <p className="text-ink-muted">아직 발송 이력이 없습니다.</p>}

      {logs && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-ink-muted">
                <th className="px-3 py-2 font-medium">수신자</th>
                <th className="px-3 py-2 font-medium">연락처</th>
                <th className="px-3 py-2 font-medium">발송시각</th>
                <th className="px-3 py-2 font-medium">상태</th>
                <th className="px-3 py-2 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line-soft last:border-0">
                  <td className="px-3 py-2 text-ink">{log.nameSnapshot ?? '(삭제된 참석자)'}</td>
                  <td className="px-3 py-2 text-ink-muted">{log.phone ?? '-'}</td>
                  <td className="px-3 py-2 text-ink-muted">{new Date(log.sentAt).toLocaleString('ko-KR')}</td>
                  <td className="px-3 py-2">
                    <StatePill tone={smsLogStatusTone(log.status)}>{log.status}</StatePill>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={!log.guestId}
                      onClick={() => setResendTarget(log)}
                      className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
                    >
                      재발송
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={resendTarget !== null}
        title="문자 재발송"
        message={resendTarget ? `"${resendTarget.nameSnapshot ?? '참석자'}" 님에게 초대 문자를 다시 보낼까요?` : ''}
        confirmLabel="재발송"
        pending={resendMutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setResendTarget(null)}
      />
    </div>
  );
}
