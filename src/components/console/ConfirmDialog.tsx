'use client';

import { Button } from '@/components/shared/Button';
import { ConsoleModal } from './modal/ConsoleModal';

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
 * 카드·스크림·닫기 3경로는 `ConsoleModal`이 소유한다 — 확인 대상 액션은 편집이 아니라
 * dirty 보호를 적용하지 않는다(§3-11 이관표).
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
  return (
    <ConsoleModal open={open} onClose={onCancel} title={title} size="md">
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
    </ConsoleModal>
  );
}
