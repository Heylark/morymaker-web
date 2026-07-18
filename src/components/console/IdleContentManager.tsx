'use client';

import { useEffect, useMemo, useState } from 'react';
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
  mode: string; // 빈 문자열 = 미지정(서버 null) — EventForm의 type 필드와 동일 관용구
  play: string; // 빈 문자열 = 미지정(서버 null) — 한글 자유 텍스트, union 절대 금지(kiosk.ts 준수)
  sortOrder: number;
}

const MODE_OPTIONS = ['branded', 'fullbleed'];

/** 등록 파일 사전검증 allowlist — kind는 여기서 자동 파생된다(수동 select 없음). File.type이
 * 실제 파일 magic byte와 사실상 일치하므로 서버의 kind↔magic byte 불일치 400을 구조적으로
 * 예방한다. */
const ALLOWED_MIME: Record<string, string[]> = {
  이미지: ['image/png', 'image/jpeg', 'image/webp'],
  영상: ['video/mp4', 'video/webm'],
};

/** kind별 업로드 크기 상한 — 정책 값이라 디자인 토큰(색·간격·모서리·모션 한정) 대상 아님. */
const MAX_BYTES: Record<string, number> = {
  이미지: 20 * 1024 * 1024,
  영상: 200 * 1024 * 1024,
};

/** 파일 MIME 타입에서 kind를 자동 파생한다 — allowlist 밖이면 null(사전검증 실패). */
export function deriveKind(mimeType: string): string | null {
  for (const [kind, mimes] of Object.entries(ALLOWED_MIME)) {
    if (mimes.includes(mimeType)) return kind;
  }
  return null;
}

/** 파생된 kind의 크기 상한 이내인지 확인한다. */
export function isWithinSizeLimit(kind: string, size: number): boolean {
  return size <= MAX_BYTES[kind];
}

export function toFormValues(content?: IdleContent): IdleContentFormValues {
  return {
    name: content?.name ?? '',
    mode: content?.mode ?? '',
    play: content?.play ?? '',
    sortOrder: content?.sortOrder ?? 0,
  };
}

/** 등록 payload — name은 폼 값 그대로, kind는 파일 선택 시 자동 파생된 값을 파라미터로 받는다
 * (폼에 kind 입력 필드가 없다 — 사용자가 종류를 잘못 선택해 서버 magic byte 불일치 400을 받는
 * 경로를 구조적으로 제거). */
export function toCreatePayload(values: IdleContentFormValues, derivedKind: string): IdleContentCreateRequest {
  return {
    name: values.name,
    kind: derivedKind,
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
  /** 없으면 등록 — 있으면 수정(name·kind·파일 읽기 전용). */
  content?: IdleContent;
  onClose: () => void;
}

/**
 * 등록/수정 모달 — SeatGroupForm 셸을 그대로 미러링한다(fixed inset-0 ... bg-black/40 +
 * rounded-card border-line-soft bg-surface, `if(!open) return null`). `values` 옵션으로
 * 편집 대상(content)이 바뀔 때마다 폼을 재동기화한다(모달 재오픈 stale 방지, SeatGroupForm과
 * 동일 근거). 등록은 name을 편집 input으로 받고 파일 선택이 필수이며, kind는 파일 MIME에서
 * 자동 파생돼 읽기 전용 배지로 노출된다(수동 선택 불가 — 서버 kind↔magic byte 불일치를
 * 구조적으로 예방). 수정은 name·종류를 읽기 전용으로 보여준다 — 서버가 등록 후 두 값 변경을
 * 받지 않기 때문이다.
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
  const [file, setFile] = useState<File | null>(null);
  const [derivedKind, setDerivedKind] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // 네이티브 file input의 표시값(선택된 파일명)을 지우는 수단 — ref.current를 직접 건드리지
  // 않는다(RHF handleSubmit 합성 지점에서 렌더 중 ref 읽기로 오탐되는 react-hooks/refs 회피).
  // key를 올리면 input이 리마운트되어 표시값이 자동으로 비워진다(IdlePlayer의 key 리마운트
  // 폴백과 동일 관용구).
  const [fileInputKey, setFileInputKey] = useState(0);
  const createMutation = useCreateIdleContent(eid);
  const updateMutation = useUpdateIdleContent(eid);
  const pending = createMutation.isPending || updateMutation.isPending;

  // 선택 파일 미리보기 — blob URL은 브라우저 리소스라 파일이 바뀌거나 폼이 언마운트될 때
  // 반드시 해제한다(onUnmounted 성격의 정당한 useEffect 사용, 데이터 페칭 대체 용도 아님).
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  const resetFileState = () => {
    setFile(null);
    setDerivedKind(null);
    setFileError(null);
    setFileInputKey((k) => k + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setDerivedKind(null);
      setFileError(null);
      return;
    }
    const kind = deriveKind(selected.type);
    if (!kind) {
      setFile(null);
      setDerivedKind(null);
      setFileError('지원하지 않는 파일 형식입니다 (이미지: PNG·JPEG·WEBP / 영상: MP4·WEBM).');
      setFileInputKey((k) => k + 1);
      return;
    }
    if (!isWithinSizeLimit(kind, selected.size)) {
      const limitMb = MAX_BYTES[kind] / (1024 * 1024);
      setFile(null);
      setDerivedKind(null);
      setFileError(`파일 크기가 너무 큽니다 (${kind} 최대 ${limitMb}MB 이하).`);
      setFileInputKey((k) => k + 1);
      return;
    }
    setFileError(null);
    setFile(selected);
    setDerivedKind(kind);
  };

  // 취소 시에도 파일 state를 비워둔다 — 이 컴포넌트는 폼이 닫혀도 언마운트되지 않으므로
  // (`if (!open) return null`이 훅 호출 이후에 있어 인스턴스가 유지된다) 취소 없이 재오픈하면
  // 이전에 선택했던 파일이 그대로 남는다.
  const handleClose = () => {
    resetFileState();
    onClose();
  };

  const onSubmit = async (values: IdleContentFormValues) => {
    if (!content) {
      if (!file || !derivedKind) {
        setFileError('파일을 선택하세요.');
        return;
      }
      await createMutation.mutateAsync({ file, request: toCreatePayload(values, derivedKind) });
      reset(toFormValues(undefined));
      resetFileState();
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
          <>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">파일 (필수)</span>
              <input
                key={fileInputKey}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                className="text-sm text-ink"
              />
            </label>
            {fileError && <p className="text-sm text-danger">{fileError}</p>}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">종류 (파일에서 자동 결정)</span>
              <span className="text-desk text-ink">{derivedKind ?? '파일을 선택하면 표시됩니다'}</span>
            </div>
            {previewUrl && derivedKind === '영상' && (
              <video src={previewUrl} muted controls playsInline className="max-h-40 rounded-card" />
            )}
            {previewUrl && derivedKind === '이미지' && (
              // eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기, next/image 최적화 대상 아님
              <img src={previewUrl} alt="선택한 파일 미리보기" className="max-h-40 rounded-card" />
            )}
          </>
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
            onClick={handleClose}
            disabled={pending}
            className="min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending || (!content && !file)}
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
