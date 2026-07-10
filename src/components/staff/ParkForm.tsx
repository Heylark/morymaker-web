'use client';

import { useForm } from 'react-hook-form';
import type { RegisterParkingRequest } from '@/types/staff';
import { ManualLocationInput } from './ManualLocationInput';

/** 요원(PRK-02) 등록 표식 — 셀프(VIS-01)의 '셀프'와 대비되는 서버 계약값(§6-6). 계정명 플러밍은 별도 범위. */
const REGISTERED_BY_STAFF = '요원';

interface ParkFormValues {
  zoneId: string;
  slotSig: string;
  plate: string;
  phone?: string;
  vipName?: string;
}

interface ParkFormProps {
  onSubmit: (request: RegisterParkingRequest) => void;
  pending: boolean;
}

/** 빈 자리 신규 등록 폼(다필드 — react-hook-form 적용 대상). */
export function ParkForm({ onSubmit, pending }: ParkFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParkFormValues>();

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit({ ...values, registeredBy: REGISTERED_BY_STAFF }))}
      className="flex flex-col gap-4"
    >
      <ManualLocationInput
        zoneIdRegister={register('zoneId', { required: true })}
        slotSigRegister={register('slotSig', { required: true })}
      />
      {(errors.zoneId || errors.slotSig) && <p className="text-sm text-danger">구획·자리 정보를 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">차량번호</span>
        <input
          {...register('plate', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      {errors.plate && <p className="text-sm text-danger">차량번호를 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">연락처 (선택)</span>
        <input {...register('phone')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">성함 (선택)</span>
        <input {...register('vipName')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {pending ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
