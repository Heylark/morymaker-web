'use client';

interface ElementColorPickerProps {
  label: string;
  /** null=미지정(게스트 기본색 상속). 네이티브 피커는 null을 표현하지 못해 표시만 fallback으로
   * 대체한다 — 사용자가 실제로 손대기 전까지는 onChange가 호출되지 않아 원본 null이 보존된다. */
  value: string | null;
  /** value가 null일 때 피커에 보여줄 기본 hex — 표시 전용이며 저장되지 않는다. */
  fallback: string;
  onChange: (next: string | null) => void;
}

/**
 * 요소 1개의 컬러 피커 — 네이티브 `<input type="color">`를 사용해 api의 `#RRGGBB` 형식
 * 검증(hex 정규식)을 브라우저가 무료로 보장하게 한다(별도 텍스트 입력·정규식 검증 UI 불요).
 * "미지정으로 되돌리기" 버튼은 값이 있을 때만 노출해 null 상태로 되돌리는 유일한 경로를 연다
 * — 색을 지정한 적 없는 요소를 실수로 hex 값으로 확정 저장하는 조용한 데이터 변형을 막는다.
 *
 * 컴포넌트 자신의 크롬(라벨·테두리·간격)은 콘솔 토큰만 사용한다. 오직 네이티브 피커가
 * 표시하는 사용자 선택 색과 그 옆의 hex 텍스트만 인라인으로 다룬다 — 사용자 데이터를 그대로
 * 보여주는 값이라 디자인 토큰으로 대체할 수 없는 정당한 예외다.
 */
export function ElementColorPicker({ label, value, fallback, onChange }: ElementColorPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-ink-muted">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={label}
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-card border border-line-soft bg-surface"
        />
        <span className="text-sm text-ink-muted">{value ?? '미지정'}</span>
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-ink-muted underline hover:text-ink"
          >
            미지정으로 되돌리기
          </button>
        )}
      </div>
    </div>
  );
}
