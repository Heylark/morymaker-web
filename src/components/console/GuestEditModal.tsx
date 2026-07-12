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

export function toFormValues(guest?: GuestResponse): GuestFormValues {
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
 *
 * 이 모달은 `RosterTable`에 항상 마운트된 채(`open`으로 표시만 토글) 유지된다 — 마운트 시점
 * 1회만 반영되는 `defaultValues`만으로는 편집 대상이 바뀌어도 폼이 갱신되지 않는다(빈 폼으로
 * 열리는 버그). `values` 옵션은 매 렌더 `guest`가 바뀔 때마다(react-hook-form 내부 deep-equal
 * 비교) 폼을 동기화하므로 편집 오픈 시 현재 값이 채워지고, 개별 등록("new")으로 되돌아가면
 * 다시 빈 값으로 리셋된다.
 */
export function GuestEditModal({ eid, open, guest, onClose }: GuestEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormValues>({
    defaultValues: toFormValues(guest),
    values: toFormValues(guest),
  });
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
