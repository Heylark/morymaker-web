'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useEvents } from '@/hooks/useEvents';
import { useCreateAccount } from '@/hooks/useCreateAccount';
import { ACCOUNT_ROLE_OPTIONS, accountRoleLabel, isEventIdsRequired } from '@/lib/account-constants';
import type { AccountRole } from '@/types/account';

interface AccountFormValues {
  email: string;
  name: string;
  role: AccountRole;
  eventIds: string[];
  note: string;
  password: string;
}

/**
 * 계정 생성 폼(EventForm+GuestEditModal 미러) — password는 관리자가 직접 지정한다(서버 자동생성
 * 아님, 재설정 API도 부재). 노출할 서버 발급 시크릿이 없어 "복사 가능한 자격증명 카드" 같은
 * 통상 시크릿 노출 패턴은 애초에 성립하지 않는다 — 입력값 확인용 show/hide 토글만 둔다.
 *
 * 성공 시 즉시 이동하지 않고 이 컴포넌트 안에서 확인 화면으로 전환한다(관리자가 방금 지정한
 * 비밀번호로 로그인하라는 안내를 놓치지 않도록 — 간단 확인 안내 후 목록으로 복귀한다).
 */
export function AccountForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    defaultValues: { email: '', name: '', role: 'EVENT_STAFF', eventIds: [], note: '', password: '' },
  });
  const { data: events } = useEvents();
  const createMutation = useCreateAccount();
  const role = watch('role');
  const eventIdsRequired = isEventIdsRequired(role);
  const noEventsYet = eventIdsRequired && events?.length === 0;

  if (createdEmail) {
    return (
      <div className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-desk-lg font-semibold text-ink">계정이 생성되었습니다</h2>
        <p className="text-ink-muted">
          <span className="font-semibold text-ink">{createdEmail}</span> 계정으로, 관리자가 지정한 비밀번호로 로그인할 수
          있습니다.
        </p>
        <Link
          href="/accounts"
          className="min-h-touch flex items-center justify-center rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink"
        >
          목록으로
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: AccountFormValues) => {
    const created = await createMutation.mutateAsync({
      email: values.email,
      name: values.name || null,
      role: values.role,
      eventIds: eventIdsRequired ? values.eventIds : [],
      note: values.note || null,
      password: values.password,
    });
    setCreatedEmail(created.email);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">이메일 (필수)</span>
        <input
          type="email"
          {...register('email', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      {errors.email && <p className="text-sm text-danger">이메일을 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">이름 (선택)</span>
        <input {...register('name')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">비밀번호 (필수, 8자 이상)</span>
        <div className="flex items-center gap-2">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: true, minLength: 8 })}
            className="min-h-touch flex-1 rounded-card border border-black/10 px-4 text-desk"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {showPassword ? '숨기기' : '보기'}
          </button>
        </div>
      </label>
      {errors.password && <p className="text-sm text-danger">비밀번호는 8자 이상이어야 합니다.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">역할 (필수)</span>
        <select
          {...register('role', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
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
          <legend className="text-sm text-ink-muted">담당 행사 (1개 이상 필수)</legend>
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
        <input {...register('note')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <button
        type="submit"
        disabled={createMutation.isPending || noEventsYet}
        className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {createMutation.isPending ? '저장 중...' : '계정 만들기'}
      </button>
      {createMutation.isError && <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>}
    </form>
  );
}
