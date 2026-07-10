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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">성함</span>
        <input
          {...register('name', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      {(errors.name || isFieldError) && <p className="text-sm text-danger">성함을 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">소속 (선택)</span>
        <input {...register('org')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">연락처 (선택)</span>
        <input {...register('phone')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">차량번호 (선택)</span>
        <input {...register('plate')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <SubmitButton pending={mutation.isPending}>{mutation.isPending ? '등록 중...' : '현장등록'}</SubmitButton>

      {isRateLimited && <p className="text-sm text-danger">잠시 후 다시 시도해 주세요.</p>}
      {mutation.isError && !isRateLimited && !isFieldError && (
        <p className="text-sm text-danger">등록 중 오류가 발생했습니다.</p>
      )}
    </form>
  );
}
