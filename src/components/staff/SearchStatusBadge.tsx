interface SearchStatusBadgeProps {
  /** 서버가 문자열 그대로 내려주는 검색 상태 — 'ONE' 외 값(예: 'MANY'/'NONE')도 그대로 받는다. */
  searchState: string;
  total: number;
}

/**
 * 검색 3상태 배지 — 주차 상태(빈자리/주차중/확인필요)와 동일 의미색 토큰을 공유한다:
 * ONE(1건)=state-active, MANY(다건)=state-review, NONE(없음)=state-empty. 색+텍스트 이중 표기로
 * 색맹 대비를 확보한다(색 단독 표시 금지).
 */
const PRESETS: Record<string, { text: string; colorClass: string }> = {
  ONE: { text: '1건', colorClass: 'bg-state-active/10 text-state-active' },
  MANY: { text: '다건', colorClass: 'bg-state-review/10 text-state-review' },
  NONE: { text: '없음', colorClass: 'bg-state-empty/10 text-state-empty' },
};

export function SearchStatusBadge({ searchState, total }: SearchStatusBadgeProps) {
  const preset = PRESETS[searchState] ?? { text: searchState, colorClass: 'bg-ink-muted/10 text-ink-muted' };
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${preset.colorClass}`}>
      {preset.text} · {total}건
    </span>
  );
}
