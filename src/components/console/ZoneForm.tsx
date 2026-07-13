'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateZone } from '@/hooks/useCreateZone';
import { useUpdateZone } from '@/hooks/useUpdateZone';
import type { ZoneResponse } from '@/types/console';

interface ZoneFormValues {
  part1: string;
  part2?: string;
  part3?: string;
  part4?: string;
  startNo: number;
  slotCount: number;
}

interface ZoneFormProps {
  eid: string;
  zone?: ZoneResponse; // 없으면 생성, 있으면 편집
}

/** 구획 생성/편집 폼 — 자리 일괄 생성(startNo·slotCount)도 이 폼의 필드로 포함한다(별도 컴포넌트로 분리하지 않음). */
export function ZoneForm({ eid, zone }: ZoneFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZoneFormValues>({
    defaultValues: zone
      ? {
          part1: zone.part1 ?? '',
          part2: zone.part2 ?? '',
          part3: zone.part3 ?? '',
          part4: zone.part4 ?? '',
          startNo: zone.startNo,
          slotCount: zone.slotCount,
        }
      : { startNo: 1 },
  });
  const createMutation = useCreateZone(eid);
  const updateMutation = useUpdateZone(eid, zone?.id ?? '');
  const pending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: ZoneFormValues) => {
    if (!zone) {
      // 생성 — 성공 시 방금 만든 구획 상세로 이동해 자리 타이틀·QR에 즉시 접근하게 한다.
      const created = await createMutation.mutateAsync(values);
      router.push(`/events/${eid}/parking/${created.id}`);
      return;
    }
    // 편집 — 자리 개수를 바꾸면 기존 자리 타이틀이 모두 초기화되므로 사전 확인을 받는다.
    if (values.slotCount !== zone.slotCount) {
      const confirmed = window.confirm(
        '자리 개수를 바꾸면 입력한 자리 타이틀이 모두 초기화됩니다. 계속할까요?',
      );
      if (!confirmed) return;
    }
    // titleOverrides는 생략 — PUT에서 생략은 "미변경"을 의미하며, 타이틀 저장은 SlotTitleTable이 담당한다.
    await updateMutation.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card border border-line-soft bg-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">구분1 (필수)</span>
        <input
          {...register('part1', { required: true })}
          className="min-h-touch rounded-card border border-line px-4 text-desk"
        />
      </label>
      {errors.part1 && <p className="text-sm text-danger">구분1을 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">구분2 (선택)</span>
        <input {...register('part2')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">구분3 (선택)</span>
        <input {...register('part3')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">구분4 (선택)</span>
        <input {...register('part4')} className="min-h-touch rounded-card border border-line px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">시작 번호</span>
        <input
          type="number"
          {...register('startNo', { required: true, valueAsNumber: true })}
          className="min-h-touch rounded-card border border-line px-4 text-desk"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">자리 개수</span>
        <input
          type="number"
          {...register('slotCount', { required: true, min: 1, valueAsNumber: true })}
          className="min-h-touch rounded-card border border-line px-4 text-desk"
        />
      </label>
      {errors.slotCount && <p className="text-sm text-danger">자리 개수는 1개 이상이어야 합니다.</p>}

      <button
        type="submit"
        disabled={pending}
        className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {pending ? '저장 중...' : zone ? '수정' : '구획 만들기'}
      </button>
      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>
      )}
    </form>
  );
}
