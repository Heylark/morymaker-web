'use client';

import { useForm } from 'react-hook-form';
import { useCreateSeatGroup } from '@/hooks/useCreateSeatGroup';
import { useUpdateSeatGroup } from '@/hooks/useUpdateSeatGroup';
import type { SeatGroupResponse } from '@/types/seat';

interface SeatGroupFormValues {
  label: string;
  numbering: boolean;
}

interface SeatGroupFormProps {
  eid: string;
  open: boolean;
  /** 없으면 신규 그룹 생성 — 있으면 수정. */
  group?: SeatGroupResponse;
  onClose: () => void;
}

export function toFormValues(group?: SeatGroupResponse): SeatGroupFormValues {
  return {
    label: group?.label ?? '',
    numbering: group?.numbering ?? false,
  };
}

/**
 * 그룹 생성·수정 모달 — GuestEditModal 셸을 그대로 미러링한다(fixed inset-0 ... bg-black/40 +
 * rounded-card border-line-soft bg-surface, `if(!open) return null`). `values` 옵션으로
 * 편집 대상(group)이 바뀔 때마다 폼을 동기화한다 — 마운트 시점 1회만 반영되는 defaultValues만
 * 으로는 그룹을 바꿔 다시 열어도 이전 값이 남는 버그가 재발한다(GuestEditModal 주석 근거 동일).
 * groupNo·sortOrder는 서버 자동 채번/불변이라 이 폼에 아예 노출하지 않는다.
 */
export function SeatGroupForm({ eid, open, group, onClose }: SeatGroupFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SeatGroupFormValues>({
    defaultValues: toFormValues(group),
    values: toFormValues(group),
  });
  const createMutation = useCreateSeatGroup(eid);
  const updateMutation = useUpdateSeatGroup(eid);
  const pending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const onSubmit = async (values: SeatGroupFormValues) => {
    const payload = { label: values.label, numbering: values.numbering };
    if (!group) {
      await createMutation.mutateAsync(payload);
      reset(toFormValues(undefined));
      onClose();
      return;
    }
    await updateMutation.mutateAsync({ gid: group.id, request: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-md flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg"
      >
        <h2 className="text-desk-lg font-semibold text-ink">{group ? '좌석 그룹 수정' : '좌석 그룹 추가'}</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">그룹명 (필수)</span>
          <input
            {...register('label', { required: true })}
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          />
        </label>
        {errors.label && <p className="text-sm text-danger">그룹명을 입력하세요.</p>}

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('numbering')} className="h-5 w-5 rounded border-line" />
          <span className="text-sm text-ink-muted">번호 지정(지정석) — 끄면 자유석으로 배정</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending}
            className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
          >
            {pending ? '저장 중...' : group ? '수정' : '추가'}
          </button>
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>
        )}
      </form>
    </div>
  );
}
