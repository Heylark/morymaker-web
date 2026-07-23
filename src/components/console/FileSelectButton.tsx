interface FileSelectButtonProps {
  accept: string;
  /** 부모 handleFileChange 그대로 전달 — 로직 이관 0 */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 현재 선택 파일명(부모 file state에서 파생: file?.name ?? null) */
  fileName?: string | null;
  label?: string;
  disabled?: boolean;
  /** ExcelUpload의 ref.value='' 리셋 관용구 보존용(선택) */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * 콘솔 파일선택 버튼 — 브라우저 기본 `<input type="file">`(파일 선택/선택된 파일 없음 텍스트,
 * 클릭 유도 0)을 숨기고 secondary 버튼 affordance로 대체한다. 기존 handleFileChange·크기
 * 검증·리셋 로직은 부모가 그대로 소유(props로 전달받아 위임할 뿐, 이관 0).
 *
 * 도달성 + 가시성: input은 `sr-only`(clip — display:none/hidden 아님)라 탭 포커스·Enter/Space로
 * 네이티브 picker가 열리고 스크린리더가 file input으로 announce한다. 다만 focusable 요소가
 * 1px clip 박스에 있으면 브라우저 기본 포커스 링이 사실상 불가시가 되므로(코드베이스 전역
 * 커스텀 포커스 스타일 0건), 감싼 `<label>`에 `focus-within` 가시 표시를 부여해 포커스 시 골드
 * 아웃라인이 라벨 둘레에 그려지도록 한다 — raw input이 갖던 네이티브 가시 포커스 링을 대체
 * (WCAG 2.4.7 회귀 방지). 포커스 아웃라인은 상호작용 어포던스이지 장식 발광이 아니므로 발광
 * 예산 0 유지와 무관하다(box-shadow가 아니라 outline).
 *
 * 토큰 참조는 `--champagne`(런타임에 실제 방출되는 토큰) — `--color-primary`는 @theme inline
 * 브리지라 CSS 커스텀 프로퍼티로 방출되지 않아 arbitrary value에서 해석 불가하다.
 */
export function FileSelectButton({ accept, onChange, fileName, label, disabled, inputRef }: FileSelectButtonProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="min-h-touch inline-flex cursor-pointer items-center rounded-card border border-line bg-transparent px-5 text-desk font-semibold text-primary hover:bg-surface-sunken focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--champagne)]">
        {label ?? '파일 선택'}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
      </label>
      <span className={fileName ? 'text-sm text-ink' : 'text-sm text-ink-muted'}>
        {fileName ?? '선택된 파일 없음'}
      </span>
    </div>
  );
}
