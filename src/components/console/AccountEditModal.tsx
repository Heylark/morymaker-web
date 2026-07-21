'use client';

import { useForm } from 'react-hook-form';
import { useEvents } from '@/hooks/useEvents';
import { useUpdateAccount } from '@/hooks/useUpdateAccount';
import { ACCOUNT_ROLE_OPTIONS, accountRoleLabel, isEventIdsRequired } from '@/lib/account-constants';
import type { AccountResponse, AccountRole } from '@/types/account';
import { ConsoleModal } from './modal/ConsoleModal';

interface AccountEditFormValues {
  name: string;
  role: AccountRole;
  eventIds: string[];
  note: string;
}

interface AccountEditModalProps {
  open: boolean;
  /** 목록에서 수정 대상으로 고른 계정 — open=true일 때 항상 함께 전달된다. */
  account?: AccountResponse;
  onClose: () => void;
}

export function toEditFormValues(account?: AccountResponse): AccountEditFormValues {
  return {
    name: account?.name ?? '',
    role: account?.role ?? 'EVENT_STAFF',
    eventIds: account?.eventIds ?? [],
    note: account?.note ?? '',
  };
}

/**
 * 계정 편집 모달(GuestEditModal 미러) — name·role·eventIds·note만 편집한다. email·password는
 * auth 계약상 서버 불변 필드라(이메일 변경·비밀번호 재설정 API 부재) 이 폼에 애초에 렌더하지
 * 않는다.
 *
 * 이 모달은 목록에 항상 마운트된 채(`open`으로 표시만 토글) 유지된다 — `values` 옵션이 매 렌더
 * `account`가 바뀔 때마다 폼을 동기화하므로(GuestEditModal과 동일 이유) 편집 대상이 바뀌어도
 * 빈 폼으로 열리는 버그가 없다.
 *
 * dirty 판정은 `formState.isDirty`를 그대로 넘긴다 — GuestEditModal과 동일 이유(ADR-028).
 * `account`가 없으면(호출부 불변식상 `open=true`와 항상 함께 전달되지만, 방어적으로) 폼 자체를
 * 렌더하지 않는다 — `account.email` 등을 아예 참조하지 않도록 `ConsoleModal` 호출 전에 가른다.
 */
export function AccountEditModal({ open, account, onClose }: AccountEditModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<AccountEditFormValues>({
    defaultValues: toEditFormValues(account),
    values: toEditFormValues(account),
  });
  const { data: events } = useEvents();
  const updateMutation = useUpdateAccount();
  const role = watch('role');
  const eventIdsRequired = isEventIdsRequired(role);

  if (!account) return null;

  const onSubmit = async (values: AccountEditFormValues) => {
    await updateMutation.mutateAsync({
      id: account.id,
      request: {
        name: values.name || null,
        role: values.role,
        eventIds: eventIdsRequired ? values.eventIds : [],
        note: values.note || null,
      },
    });
    onClose();
  };

  return (
    <ConsoleModal open={open} onClose={onClose} title="계정 수정" dirty={isDirty} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{account.email}</p>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">이름 (선택)</span>
          <input {...register('name')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">역할</span>
          <select
            {...register('role', { required: true })}
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          >
            {ACCOUNT_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {accountRoleLabel(r)}
              </option>
            ))}
          </select>
        </label>

        {eventIdsRequired && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-muted">담당 행사 (1개 이상)</legend>
            {events && events.length === 0 && (
              <p className="text-sm text-danger">등록된 행사가 없습니다. 행사를 먼저 생성하세요.</p>
            )}
            {events?.map((event) => (
              <label key={event.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={event.id}
                  {...register('eventIds', { required: eventIdsRequired })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-ink">{event.name}</span>
              </label>
            ))}
            {errors.eventIds && <p className="text-sm text-danger">담당 행사를 1개 이상 선택하세요.</p>}
          </fieldset>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">메모 (선택)</span>
          <input {...register('note')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
          >
            {updateMutation.isPending ? '저장 중...' : '수정'}
          </button>
        </div>
        {updateMutation.isError && <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>}
      </form>
    </ConsoleModal>
  );
}
