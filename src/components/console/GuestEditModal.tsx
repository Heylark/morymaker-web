'use client';

import { useForm } from 'react-hook-form';
import { useCreateGuest } from '@/hooks/useCreateGuest';
import { useUpdateGuest } from '@/hooks/useUpdateGuest';
import type { GuestResponse } from '@/types/guest';

interface GuestFormValues {
  name: string;
  org: string;
  title: string;
  phone: string;
  plate: string;
}

interface GuestEditModalProps {
  eid: string;
  open: boolean;
  /** 없으면 개별 등록(ADM-09 흡수, src=현장 고정) — 있으면 수정. */
  guest?: GuestResponse;
  onClose: () => void;
}

function toFormValues(guest?: GuestResponse): GuestFormValues {
  return {
    name: guest?.name ?? '',
    org: guest?.org ?? '',
    title: guest?.title ?? '',
    phone: guest?.phone ?? '',
    plate: guest?.plate ?? '',
  };
}

/**
 * 개별 등록/수정 폼 — EventForm/ZoneForm 폼 골격을 계승하되 헤어라인은 신규 코드 원칙대로
 * `border-line`을 사용한다(§7-b-1 — 구파일 `border-black/N` 복붙 금지). `status`·`seatGroupId`는
 * 타입에 없어 이 폼에 애초에 렌더할 수 없다(체크인 취소는 §5-3 별도 범위, 좌석은 좌석 SSOT REQ 범위).
 */
export function GuestEditModal({ eid, open, guest, onClose }: GuestEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormValues>({ defaultValues: toFormValues(guest) });
  const createMutation = useCreateGuest(eid);
  const updateMutation = useUpdateGuest(eid);
  const pending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const onSubmit = async (values: GuestFormValues) => {
    const payload = {
      name: values.name,
      org: values.org || null,
      title: values.title || null,
      phone: values.phone || null,
      plate: values.plate || null,
    };
    if (!guest) {
      await createMutation.mutateAsync({ ...payload, src: '현장' });
      reset(toFormValues(undefined));
      onClose();
      return;
    }
    await updateMutation.mutateAsync({ gid: guest.id, request: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-md flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg"
      >
        <h2 className="text-desk-lg font-semibold text-ink">{guest ? '참석자 수정' : '개별 등록'}</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">이름 (필수)</span>
          <input
            {...register('name', { required: true })}
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          />
        </label>
        {errors.name && <p className="text-sm text-danger">이름을 입력하세요.</p>}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">소속 (선택)</span>
          <input {...register('org')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">직함 (선택)</span>
          <input {...register('title')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">연락처 (선택)</span>
          <input {...register('phone')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">차량번호 (선택)</span>
          <input {...register('plate')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
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
            {pending ? '저장 중...' : guest ? '수정' : '등록'}
          </button>
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>
        )}
      </form>
    </div>
  );
}
