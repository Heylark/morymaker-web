'use client';

import { Controller, useForm } from 'react-hook-form';
import { ElementColorPicker } from '@/components/shared/ElementColorPicker';
import { BrandingPreview } from './BrandingPreview';
import { useUpdateBranding } from '@/hooks/useUpdateBranding';
import type { EventBrandingUpdateRequest, EventResponse } from '@/types/console';

interface BrandingFormValues {
  bgColor: string | null;
  pointColor: string | null;
  titleColor: string | null;
  bodyColor: string | null;
  kv: string | null;
  defaultIdleMode: string | null;
}

interface BrandingFormProps {
  eid: string;
  event: EventResponse;
}

/** 요소별 표시 전용 fallback hex — 게스트 다크 시그니처 기본색 근사(tokens.css 다크 값과 정합).
 * "미지정" 상태의 피커 표시에만 쓰이고, 사용자가 실제로 값을 바꾸기 전까지는 저장되지 않는다. */
const FALLBACK_HEX = {
  bgColor: '#08090c',
  pointColor: '#d4b36a',
  titleColor: '#f0dca8',
  bodyColor: '#ede9e0',
};

export function toFormValues(event: EventResponse): BrandingFormValues {
  return {
    bgColor: event.bgColor,
    pointColor: event.pointColor,
    titleColor: event.titleColor,
    bodyColor: event.bodyColor,
    kv: event.kv,
    defaultIdleMode: event.defaultIdleMode,
  };
}

/**
 * 행사 브랜딩 컬러 폼 — 컬러 4종만 편집한다. `kv`·`defaultIdleMode`는 이 폼에 편집 UI가 없지만
 * 저장 payload에는 현재값을 그대로 라운드트립한다: PUT branding이 full-replace 의미일 경우
 * 컬러만 보내면 두 필드가 조용히 지워지므로(클로버), 폼 state가 6필드를 모두 들고 있다가
 * 제출 시 그대로 되돌려 보낸다.
 *
 * `isDirty` 게이트로 저장 버튼·미저장 배지를 연동한다 — 브랜딩은 저장 즉시 라이브 반영(게스트
 * 파이프라인 배선 후) 대상이라 EventForm보다 "실수 저장 방지" 의도를 강하게 반영한다.
 * 저장 성공 시 App Router가 이 컴포넌트를 리마운트하지 않으므로, 변이 반환값으로 폼을 즉시
 * 재동기화한다(react.md 방식 b — useEffect props→state 동기화 안티패턴 회피, EventForm 계승).
 */
export function BrandingForm({ eid, event }: BrandingFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<BrandingFormValues>({ defaultValues: toFormValues(event) });
  const updateMutation = useUpdateBranding(eid);
  const previewValues = watch();

  const onSubmit = async (values: BrandingFormValues) => {
    const payload: EventBrandingUpdateRequest = values;
    const updated = await updateMutation.mutateAsync(payload);
    reset(toFormValues(updated));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-card border border-line-soft bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-desk-lg font-semibold text-ink">행사 브랜딩 컬러</h2>
        {isDirty && (
          <span className="rounded-card bg-surface-sunken px-3 py-1 text-sm text-ink-muted">
            저장되지 않은 변경
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="bgColor"
          control={control}
          render={({ field }) => (
            <ElementColorPicker
              label="배경색"
              value={field.value}
              fallback={FALLBACK_HEX.bgColor}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="pointColor"
          control={control}
          render={({ field }) => (
            <ElementColorPicker
              label="포인트색"
              value={field.value}
              fallback={FALLBACK_HEX.pointColor}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="titleColor"
          control={control}
          render={({ field }) => (
            <ElementColorPicker
              label="제목색"
              value={field.value}
              fallback={FALLBACK_HEX.titleColor}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="bodyColor"
          control={control}
          render={({ field }) => (
            <ElementColorPicker
              label="본문색"
              value={field.value}
              fallback={FALLBACK_HEX.bodyColor}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <BrandingPreview
        bgColor={previewValues.bgColor ?? FALLBACK_HEX.bgColor}
        pointColor={previewValues.pointColor ?? FALLBACK_HEX.pointColor}
        titleColor={previewValues.titleColor ?? FALLBACK_HEX.titleColor}
        bodyColor={previewValues.bodyColor ?? FALLBACK_HEX.bodyColor}
      />

      <button
        type="submit"
        disabled={!isDirty || updateMutation.isPending}
        className="min-h-touch self-start rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {updateMutation.isPending ? '저장 중...' : '저장'}
      </button>
      {updateMutation.isError && <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>}
    </form>
  );
}
