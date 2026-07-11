'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { useUpdateEvent } from '@/hooks/useUpdateEvent';
import type { EventResponse } from '@/types/console';

const EVENT_STATUS_OPTIONS = ['준비', '운영중', '종료'];
const EVENT_TYPE_OPTIONS = ['연회식', '극장식 지정석', '극장식 자유석'];

/**
 * ISO(offset) 문자열 → `<input type="datetime-local">` 값(YYYY-MM-DDTHH:mm, 로컬 타임존,
 * 초 절단)으로 변환한다. null이거나 파싱 실패하면 빈 문자열(미지정으로 취급).
 */
export function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * `<input type="datetime-local">` 값(로컬 타임존 기준 해석) → ISO 문자열로 변환한다.
 * 빈 값은 null(선택 필드 — 서버가 미지정으로 받는다).
 */
export function datetimeLocalToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface EventFormValues {
  name: string;
  eventDate: string; // datetime-local 입력값(빈 문자열 = 미지정)
  place: string;
  type: string; // 빈 문자열 = 미지정
  kv: string;
  status: string;
  active: boolean;
}

interface EventFormProps {
  event?: EventResponse; // 없으면 생성, 있으면 편집
}

function toFormValues(event: EventResponse): EventFormValues {
  return {
    name: event.name,
    eventDate: isoToDatetimeLocal(event.eventDate),
    place: event.place ?? '',
    type: event.type ?? '',
    kv: event.kv ?? '',
    status: event.status,
    active: event.active,
  };
}

/**
 * 행사 생성/편집 폼(ZoneForm 미러) — `event?` 없으면 생성, 있으면 편집.
 * 브랜딩 컬러 필드는 타입 레벨에서 제외돼 있어 이 폼에는 애초에 렌더할 수 없다(별도 REQ 범위).
 * status/active는 편집일 때만 렌더한다(create 요청 타입에 아예 없는 필드).
 */
export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: event ? toFormValues(event) : { name: '', eventDate: '', place: '', type: '', kv: '' },
  });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(event?.id ?? '');
  const pending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: EventFormValues) => {
    const eventDate = datetimeLocalToIso(values.eventDate);
    if (!event) {
      // 생성 — 컬러·status·active는 타입에 없어 전송 자체가 불가능하다(서버 기본값 상속).
      await createMutation.mutateAsync({
        name: values.name,
        eventDate,
        place: values.place || null,
        type: values.type || null,
        kv: values.kv || null,
      });
      router.push('/events');
      return;
    }
    // 편집 — App Router가 이 컴포넌트를 리마운트하지 않으므로, 변이 반환값으로 폼을
    // 즉시 재동기화한다(react.md 방식 b — useEffect props→state 동기화 안티패턴 회피).
    const updated = await updateMutation.mutateAsync({
      name: values.name,
      eventDate,
      place: values.place || null,
      type: values.type || null,
      kv: values.kv || null,
      status: values.status,
      active: values.active,
    });
    reset(toFormValues(updated));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-black/5"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">행사명 (필수)</span>
        <input
          {...register('name', { required: true })}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>
      {errors.name && <p className="text-sm text-danger">행사명을 입력하세요.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">행사 일시 (선택)</span>
        <input
          type="datetime-local"
          {...register('eventDate')}
          className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">장소 (선택)</span>
        <input {...register('place')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">유형 (선택)</span>
        <select {...register('type')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk">
          <option value="">선택 안 함</option>
          {EVENT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">키비주얼 (선택)</span>
        <input {...register('kv')} className="min-h-touch rounded-card border border-black/10 px-4 text-desk" />
      </label>

      {event && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">상태</span>
            <select
              {...register('status', { required: true })}
              className="min-h-touch rounded-card border border-black/10 px-4 text-desk"
            >
              {EVENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('active')} className="h-5 w-5" />
            <span className="text-sm text-ink-muted">키오스크·공개 화면에 노출</span>
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
      >
        {pending ? '저장 중...' : event ? '수정' : '행사 만들기'}
      </button>
      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>
      )}
    </form>
  );
}
