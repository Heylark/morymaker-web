'use client';

import { Button } from '@/components/shared/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** 되돌리기 어려운 위험 액션(제외 등) 강조 — 확인 버튼에 danger 링을 덧씌운다(신규 색조 도입 없음). */
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 콘솔 스코프 확인 모달 — 발송·재발송·명단 제외 등 되돌리기 위험 액션 공통 게이트.
 * 코드베이스에 재사용 가능한 기존 모달 패턴이 없어 처음부터 설계(공유 Button primitive만 소비).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg">
        <h2 className="text-desk-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onCancel} disabled={pending}>
            취소
          </Button>
          <Button
            variant="gold"
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={danger ? 'ring-2 ring-danger' : undefined}
          >
            {pending ? '처리 중...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
