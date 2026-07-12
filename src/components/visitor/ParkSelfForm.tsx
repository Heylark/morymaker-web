'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useSelfPark } from '@/hooks/useSelfPark';
import { VisitorApiError } from '@/lib/api/visitor';
import { parkDoneStorageKey } from '@/lib/visitor-storage';
import { SlotAutoLabel } from '@/components/shared/SlotAutoLabel';
import { SubmitButton } from './SubmitButton';
import type { PublicSlot, RecordRegisterRequest } from '@/types/visitor';

interface ParkSelfFormProps {
  slotCode: string;
  slot: PublicSlot;
  occupied: boolean;
  token?: string;
}

interface ParkSelfFormValues {
  plate: string;
}

/**
 * VIS-01 셀프 주차 폼 — 차량번호*만 사용자 입력(이름·연락처는 api가 이미 dev-default로
 * 채운다). 주차중 자리 승계(occupied=true)는 경고 배너를 추가로 노출한다 — 서버 승계 정책
 * 자체는 불변이며 web은 트리거만 담당한다. 성공 시 결과를 sessionStorage에 미러하고
 * 완료 화면(/p/{slotCode}/done)으로 이동한다.
 */
export function ParkSelfForm({ slotCode, slot, occupied, token }: ParkSelfFormProps) {
  const router = useRouter();
  const mutation = useSelfPark(slotCode);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParkSelfFormValues>();

  function onSubmit(values: ParkSelfFormValues) {
    const request: RecordRegisterRequest = { plate: values.plate };
    if (token) request.token = token;

    mutation.mutate(request, {
      onSuccess: (result) => {
        sessionStorage.setItem(parkDoneStorageKey(slotCode), JSON.stringify(result));
        router.push(`/p/${slotCode}/done`);
      },
    });
  }

  const isRateLimited = mutation.error instanceof VisitorApiError && mutation.error.status === 429;
  const isFieldError = mutation.error instanceof VisitorApiError && mutation.error.status === 400;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-frame)] border border-line-soft bg-surface-sunken px-3.5 py-3">
        <SlotAutoLabel fullName={`이 자리: ${slot.display}`} />
      </div>

      {occupied && (
        <p className="rounded-[var(--radius-frame)] border border-line bg-[var(--card-hi)] px-3.5 py-3 text-xs text-ink-muted">
          기존 등록은 자동 출차 처리되고 현장 요원이 확인합니다.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--fs-label-sm)] uppercase tracking-[var(--ls-label)] text-[var(--faint)]">
          차량번호
        </span>
        <input
          {...register('plate', { required: true })}
          className="min-h-touch rounded-[var(--radius-sharp)] border border-line-soft bg-surface px-3.5 text-desk text-ink"
        />
      </label>
      {(errors.plate || isFieldError) && <p className="text-sm text-danger">차량번호를 입력하세요.</p>}

      <SubmitButton pending={mutation.isPending}>{mutation.isPending ? '등록 중...' : '등록'}</SubmitButton>

      {isRateLimited && <p className="text-sm text-danger">잠시 후 다시 시도해 주세요.</p>}
      {mutation.isError && !isRateLimited && !isFieldError && (
        <p className="text-sm text-danger">등록 중 오류가 발생했습니다.</p>
      )}
    </form>
  );
}
