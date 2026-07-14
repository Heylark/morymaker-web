'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/shared/Button';
import { useIdleContents } from '@/hooks/useIdleContents';
import { useCreateIdleContent } from '@/hooks/useCreateIdleContent';
import { useUpdateIdleContent } from '@/hooks/useUpdateIdleContent';
import type { IdleContent } from '@/types/kiosk';
import type { IdleContentCreateRequest, IdleContentUpdateRequest } from '@/types/idle-content';

interface IdleContentManagerProps {
  eid: string;
}

interface IdleContentFormValues {
  name: string;
  kind: string;
  mode: string; // 빈 문자열 = 미지정(서버 null) — EventForm의 type 필드와 동일 관용구
  play: string; // 빈 문자열 = 미지정(서버 null) — 한글 자유 텍스트, union 절대 금지(kiosk.ts 준수)
  sortOrder: number;
}

const KIND_OPTIONS = ['이미지', '영상'];
const MODE_OPTIONS = ['branded', 'fullbleed'];

export function toFormValues(content?: IdleContent): IdleContentFormValues {
  return {
    name: content?.name ?? '',
    kind: content?.kind ?? KIND_OPTIONS[0],
    mode: content?.mode ?? '',
    play: content?.play ?? '',
    sortOrder: content?.sortOrder ?? 0,
  };
}

/** 등록 payload — name·kind가 서버 필수 필드라 그대로 포함한다. */
export function toCreatePayload(values: IdleContentFormValues): IdleContentCreateRequest {
  return {
    name: values.name,
    kind: values.kind,
    mode: values.mode || null,
    play: values.play || null,
    sortOrder: values.sortOrder,
  };
}

/** 수정 payload — 서버 PUT 계약(mode·play·sortOrder만) 미러. name·kind는 절대 포함하지 않는다
 * (등록 후 두 필드는 불변 — IdleContentUpdateRequest가 타입 레벨에서도 이미 제외). */
export function toUpdatePayload(values: IdleContentFormValues): IdleContentUpdateRequest {
  return {
    mode: values.mode || null,
    play: values.play || null,
    sortOrder: values.sortOrder,
  };
}

interface IdleContentFormProps {
  eid: string;
  open: boolean;
  /** 없으면 등록 — 있으면 수정(name·kind 읽기 전용). */
  content?: IdleContent;
  onClose: () => void;
}

/**
 * 등록/수정 모달 — SeatGroupForm 셸을 그대로 미러링한다(fixed inset-0 ... bg-black/40 +
 * rounded-card border-line-soft bg-surface, `if(!open) return null`). `values` 옵션으로
 * 편집 대상(content)이 바뀔 때마다 폼을 재동기화한다(모달 재오픈 stale 방지, SeatGroupForm과
 * 동일 근거). 등록은 name·kind를 편집 input으로 받고, 수정은 두 필드를 읽기 전용 텍스트로
 * 보여준다 — 서버가 등록 후 두 필드 변경을 받지 않기 때문이다(값을 읽지 않더라도 폼에는
 * 남아있지만 submit 시 toUpdatePayload가 애초에 참조하지 않아 전송되지 않는다).
 */
function IdleContentForm({ eid, open, content, onClose }: IdleContentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdleContentFormValues>({
    defaultValues: toFormValues(content),
    values: toFormValues(content),
  });
  const createMutation = useCreateIdleContent(eid);
  const updateMutation = useUpdateIdleContent(eid);
  const pending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const onSubmit = async (values: IdleContentFormValues) => {
    if (!content) {
      await createMutation.mutateAsync(toCreatePayload(values));
      reset(toFormValues(undefined));
      onClose();
      return;
    }
    await updateMutation.mutateAsync({ cid: content.id, request: toUpdatePayload(values) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-md flex-col gap-4 rounded-card border border-line-soft bg-surface p-6 shadow-lg"
      >
        <h2 className="text-desk-lg font-semibold text-ink">
          {content ? '대기화면 콘텐츠 수정' : '대기화면 콘텐츠 등록'}
        </h2>

        {content ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">이름</span>
            <span className="text-desk text-ink">{content.name}</span>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">이름 (필수)</span>
              <input
                {...register('name', { required: true })}
                className="min-h-touch rounded-card border border-line px-4 text-desk"
              />
            </label>
            {errors.name && <p className="text-sm text-danger">이름을 입력하세요.</p>}
          </>
        )}

        {content ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">종류</span>
            <span className="text-desk text-ink">{content.kind}</span>
          </div>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">종류</span>
            <select {...register('kind')} className="min-h-touch rounded-card border border-line px-4 text-desk">
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">노출 모드 (선택)</span>
          <select {...register('mode')} className="min-h-touch rounded-card border border-line px-4 text-desk">
            <option value="">미지정</option>
            {MODE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">재생 옵션 (선택)</span>
          <input
            {...register('play')}
            placeholder="예: 자동재생"
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">정렬 순서</span>
          <input
            type="number"
            {...register('sortOrder', { valueAsNumber: true, required: true })}
            className="min-h-touch rounded-card border border-line px-4 text-desk"
          />
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
            {pending ? '저장 중...' : content ? '수정' : '등록'}
          </button>
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-danger">저장 중 오류가 발생했습니다.</p>
        )}
      </form>
    </div>
  );
}

/**
 * 대기화면 콘텐츠 목록 + 등록/수정 오케스트레이션 — 카드 리스트 단일 렌더(행사당 콘텐츠 수가
 * 적어 SeatGroupList처럼 md 분기 이중 렌더는 불요, YAGNI — 콘솔 모바일 패턴의 dense 표만
 * 이중 렌더 대상). 삭제 버튼은 렌더하지 않는다 — DELETE 엔드포인트가 api에 없다
 * (idle-contents.ts 주석과 동일 근거, 실수로 존재하지 않는 동작을 노출하지 않는다).
 * 최상위 `<div>`(상위 BrandingClient·셸이 이미 `<main>`을 보유하므로 랜드마크 중복 방지).
 */
export function IdleContentManager({ eid }: IdleContentManagerProps) {
  const { data: contents, isLoading, isError } = useIdleContents(eid);
  const [editingContent, setEditingContent] = useState<IdleContent | undefined>();
  const [formOpen, setFormOpen] = useState(false);

  const openCreate = () => {
    setEditingContent(undefined);
    setFormOpen(true);
  };
  const openEdit = (content: IdleContent) => {
    setEditingContent(content);
    setFormOpen(true);
  };
  const closeForm = () => setFormOpen(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-desk-lg font-semibold text-ink">대기화면 콘텐츠</h2>
        <Button variant="gold" type="button" onClick={openCreate}>
          콘텐츠 등록
        </Button>
      </div>
      <p className="text-sm text-ink-muted">콘텐츠 삭제는 현재 지원되지 않습니다.</p>

      {isLoading && <p className="text-ink-muted">불러오는 중...</p>}
      {isError && <p className="text-danger">콘텐츠 목록을 불러오지 못했습니다.</p>}
      {contents && contents.length === 0 && <p className="text-ink-muted">등록된 대기화면 콘텐츠가 없습니다.</p>}

      {contents && contents.length > 0 && (
        <ul className="flex flex-col gap-3">
          {contents.map((content) => (
            <li
              key={content.id}
              className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-desk font-semibold text-ink">{content.name}</span>
                <span className="text-sm text-ink-muted">
                  {content.kind} · {content.mode ?? '모드 미지정'} · {content.play ?? '재생옵션 미지정'} · 순서{' '}
                  {content.sortOrder}
                </span>
              </div>
              <Button variant="ghost" type="button" onClick={() => openEdit(content)}>
                수정
              </Button>
            </li>
          ))}
        </ul>
      )}

      <IdleContentForm eid={eid} open={formOpen} content={editingContent} onClose={closeForm} />
    </div>
  );
}
