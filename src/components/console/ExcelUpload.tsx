'use client';

import { useRef, useState } from 'react';
import { useImportPreview } from '@/hooks/useImportPreview';
import { useConfirmImport } from '@/hooks/useConfirmImport';
import { useImportTemplate } from '@/hooks/useImportTemplate';
import {
  GuestImportFilePasswordProtectedError,
  GuestImportFileUnreadableError,
  GuestImportHeaderMismatchError,
} from '@/lib/api/guests';
import { MergePreview } from './MergePreview';

/**
 * 업로드 직전 클라측 파일 크기 사전검증 임계 — Next Route Handler(~1MB)·Spring(기본 1MB) 이중
 * 한도보다 먼저 차단해 불명확한 500 대신 명시 안내를 준다(§5-2). api `application.yml`
 * 상향은 이번 REQ 범위 밖(기본값 무접촉).
 */
const MAX_UPLOAD_BYTES = 1024 * 1024;

interface ExcelUploadProps {
  eid: string;
  /** 확정 임포트 성공 직후 1회 호출 — 모달 래퍼가 이 신호로 닫는다. 실패 시(throw) 호출되지 않는다. */
  onConfirmSuccess?: () => void;
}

/**
 * File 선택 → 미리보기(`useImportPreview`) → `MergePreview` → [확정](`useConfirmImport`, 동일
 * File 재사용). confirmImport는 preview 토큰을 재사용하지 않고 파일을 다시 파싱하므로(사실 D),
 * 재선택 전까지는 항상 같은 File 객체로 두 호출을 수행한다 — 재선택 시 프리뷰가 자동 재실행된다.
 *
 * 카드 테두리·배경·자체 제목은 갖지 않는다(내용 전용) — 모달 래퍼가 카드와 제목을 소유한다.
 */
export function ExcelUpload({ eid, onConfirmSuccess }: ExcelUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const previewMutation = useImportPreview(eid);
  const confirmMutation = useConfirmImport(eid);
  const templateMutation = useImportTemplate(eid);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    previewMutation.reset();
    confirmMutation.reset();
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setSizeError('명단 파일이 너무 큽니다 (약 1MB 이하로 준비해 주세요).');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSizeError(null);
    setFile(selected);
    previewMutation.mutate(selected);
  };

  const handleConfirm = async () => {
    if (!file) return;
    await confirmMutation.mutateAsync(file); // 실패 시 throw — 아래 콜백에 도달하지 않는다
    onConfirmSuccess?.();
  };

  const handleReset = () => {
    setFile(null);
    setSizeError(null);
    previewMutation.reset();
    confirmMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 서버가 안내 문장을 조립해 내려주는 업로드 오류들 — 화면은 그 문장을 그대로 노출한다(문구 소유권은
  // 서버). 셋은 원인도 해결 방법도 다르지만 화면이 추가로 그릴 것은 없다. 양식 받기 버튼은 항상 떠
  // 있고 암호 해제는 화면 밖 작업이라, 차이는 문장 안에서 이미 전달된다.
  const previewGuidance =
    previewMutation.error instanceof GuestImportHeaderMismatchError ||
    previewMutation.error instanceof GuestImportFileUnreadableError ||
    previewMutation.error instanceof GuestImportFilePasswordProtectedError
      ? previewMutation.error.message
      : null;

  const confirmGuidance =
    confirmMutation.error instanceof GuestImportHeaderMismatchError ||
    confirmMutation.error instanceof GuestImportFileUnreadableError ||
    confirmMutation.error instanceof GuestImportFilePasswordProtectedError
      ? confirmMutation.error.message
      : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">미리보기입니다 — 아래 [확정]을 눌러야 실제로 반영됩니다.</p>

      <button
        type="button"
        onClick={() => templateMutation.mutate()}
        disabled={templateMutation.isPending}
        className="min-h-touch w-fit rounded-card border border-line-soft px-4 text-sm font-semibold text-ink hover:bg-surface-sunken disabled:opacity-50"
      >
        {templateMutation.isPending ? '받는 중...' : '템플릿 받기'}
      </button>
      {templateMutation.isError && (
        <p className="text-sm text-danger">양식 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}

      <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="text-sm text-ink" />
      {sizeError && <p className="text-sm text-danger">{sizeError}</p>}

      {previewMutation.isPending && <p className="text-ink-muted">미리보기 확인 중...</p>}
      {previewMutation.isError && (
        <p className="text-sm text-danger">
          {previewGuidance ?? '미리보기를 불러오지 못했습니다. 파일을 다시 선택해 주세요.'}
        </p>
      )}

      {previewMutation.data && !confirmMutation.isSuccess && (
        <>
          <MergePreview preview={previewMutation.data} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="min-h-touch rounded-card bg-primary px-6 text-desk font-semibold text-primary-ink disabled:opacity-50"
            >
              {confirmMutation.isPending ? '반영 중...' : '확정'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-touch rounded-card px-4 text-sm text-ink-muted hover:text-ink"
            >
              다시 선택
            </button>
          </div>
        </>
      )}

      {confirmMutation.isSuccess && confirmMutation.data && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink">
            반영 완료 — 신규 {confirmMutation.data.newCount}건 · 수정 {confirmMutation.data.updatedCount}건 · 취소{' '}
            {confirmMutation.data.cancelledCount}건
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-touch w-fit rounded-card px-4 text-sm text-ink-muted hover:text-ink"
          >
            새 파일 업로드
          </button>
        </div>
      )}
      {confirmMutation.isError && (
        <p className="text-sm text-danger">
          {confirmGuidance ?? '확정 중 오류가 발생했습니다. 같은 파일로 다시 시도해 주세요.'}
        </p>
      )}
    </div>
  );
}
