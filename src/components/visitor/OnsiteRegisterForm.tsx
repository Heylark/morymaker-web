'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useOnsiteRegister } from '@/hooks/useOnsiteRegister';
import { VisitorApiError } from '@/lib/api/visitor';
import { SubmitButton } from './SubmitButton';
import type { OnsiteRegisterRequest } from '@/types/visitor';

interface OnsiteRegisterFormProps {
  eventCode: string;
}

interface OnsiteRegisterFormValues {
  name: string;
  org?: string;
  phone?: string;
  plate?: string;
}

/** eventCode-scoped 키 — 등록 성공 직후 결과를 done 화면이 읽을 때까지만 보관한다. */
function onsiteDoneStorageKey(eventCode: string): string {
  return `visitor:onsite-done:${eventCode}`;
}

/** VIS-02 현장등록 폼(이름* · 소속 · 연락처 · 차량번호?) — 성공 시 sessionStorage에 결과를 저장하고 완료 화면으로 이동한다. */
export function OnsiteRegisterForm({ eventCode }: OnsiteRegisterFormProps) {
  const router = useRouter();
  const mutation = useOnsiteRegister(eventCode);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnsiteRegisterFormValues>();

  function onSubmit(values: OnsiteRegisterFormValues) {
    const request: OnsiteRegisterRequest = { name: values.name };
    if (values.org) request.org = values.org;
    if (values.phone) request.phone = values.phone;
    if (values.plate) request.plate = values.plate;

    mutation.mutate(request, {
      onSuccess: (result) => {
        // URL query에 token을 노출하지 않기 위해 sessionStorage로 전달(refresh 생존).
        sessionStorage.setItem(onsiteDoneStorageKey(eventCode), JSON.stringify(result));
        router.push(`/r/${eventCode}/done`);
      },
    });
  }

  const isRateLimited = mutation.error instanceof VisitorApiError && mutation.error.status === 429;
  const isFieldError = mutation.error instanceof VisitorApiError && mutation.error.status === 400;

  const fieldLabelClass =
    'flex items-center justify-between text-[length:var(--fs-label-sm)] uppercase tracking-[var(--ls-label)] text-[var(--faint)]';
  const requiredInputClass =
    'min-h-touch rounded-[var(--radius-sharp)] border border-line bg-surface px-3.5 text-desk text-ink';
  const optionalInputClass =
    'min-h-touch rounded-[var(--radius-sharp)] border border-line-soft bg-surface px-3.5 text-desk text-ink';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>성함</span>
        <input {...register('name', { required: true })} className={requiredInputClass} />
      </label>
      {(errors.name || isFieldError) && <p className="text-sm text-danger">성함을 입력하세요.</p>}

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>
          소속 <span className="text-[10px] normal-case tracking-normal text-[var(--faint)]">선택</span>
        </span>
        <input {...register('org')} className={optionalInputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>
          연락처 <span className="text-[10px] normal-case tracking-normal text-[var(--faint)]">선택</span>
        </span>
        <input {...register('phone')} className={optionalInputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>
          차량번호 <span className="text-[10px] normal-case tracking-normal text-[var(--faint)]">선택</span>
        </span>
        <input {...register('plate')} className={optionalInputClass} />
      </label>

      <SubmitButton pending={mutation.isPending}>{mutation.isPending ? '등록 중...' : '현장등록'}</SubmitButton>

      {isRateLimited && <p className="text-sm text-danger">잠시 후 다시 시도해 주세요.</p>}
      {mutation.isError && !isRateLimited && !isFieldError && (
        <p className="text-sm text-danger">등록 중 오류가 발생했습니다.</p>
      )}
    </form>
  );
}
