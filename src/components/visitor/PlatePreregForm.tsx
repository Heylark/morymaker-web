'use client';

import { useForm } from 'react-hook-form';
import { usePreregPlate } from '@/hooks/usePreregPlate';
import { SubmitButton } from './SubmitButton';
import type { HubPrereg } from '@/types/visitor';

interface PlatePreregFormProps {
  token: string;
  prereg: HubPrereg;
}

interface PlatePreregValues {
  plate: string;
}

/** 차량 사전등록 폼 — 이미 등록돼 있으면(`prereg.plateRegistered`) 기존 값으로 프리필해 수정 모드로 보인다. */
export function PlatePreregForm({ token, prereg }: PlatePreregFormProps) {
  const mutation = usePreregPlate(token);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlatePreregValues>({ defaultValues: { plate: prereg.plate ?? '' } });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values.plate))}
      className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
    >
      <p className="text-desk font-semibold text-ink">
        {prereg.plateRegistered ? '차량 사전등록 (수정)' : '차량 사전등록'}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">차량번호</span>
        <input
          {...register('plate', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      {errors.plate && <p className="text-sm text-danger">차량번호를 입력하세요.</p>}

      <SubmitButton pending={mutation.isPending}>{mutation.isPending ? '등록 중...' : '등록'}</SubmitButton>

      {mutation.isError && <p className="text-sm text-danger">등록 중 오류가 발생했습니다. 다시 시도해 주세요.</p>}
      {mutation.isSuccess && <p className="text-sm text-success">{mutation.data.message}</p>}
    </form>
  );
}
