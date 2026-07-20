import type { GuestImportPreviewResponse } from '@/types/guest';

interface MergePreviewProps {
  preview: GuestImportPreviewResponse;
}

/** 카운트 요약 문구 조립 — 렌더 없이 단위 테스트 가능한 순수 함수. */
export function summarizeImportPreview(preview: GuestImportPreviewResponse): string {
  return `신규 ${preview.newCount}건 · 수정 ${preview.updatedCount}건 · 제외 ${preview.excludedCount}건`;
}

/**
 * 엑셀 프리뷰 결과 — 카운트 요약형(CP-1 ② 확정). 실 서버 응답(`GuestImportPreviewResponse`)이
 * spec 목업과 달리 항목별 상세(이름·변경 필드·before/after)를 계산·반환하지 않아, 카운트 +
 * `invalidRows` 목록만 렌더 가능하다(실측 사실 C). DB에 아직 아무 영향이 없는 미리보기 단계임을
 * 호출부(ExcelUpload)가 별도 안내 문구로 명시한다.
 */
export function MergePreview({ preview }: MergePreviewProps) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line-soft bg-surface-sunken p-4">
      <p className="text-desk font-semibold text-ink">{summarizeImportPreview(preview)}</p>
      {preview.invalidRows.length === 0 ? (
        <p className="text-sm text-ink-muted">유효성 오류 없음.</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-danger">유효성 오류 {preview.invalidRows.length}건 — 반영에서 제외됩니다.</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-muted">
            {preview.invalidRows.map((row) => (
              <li key={row.rowNumber}>
                {row.rowNumber}행 — {row.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
