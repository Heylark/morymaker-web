import { StatePill } from '@/components/shared/StatePill';

interface SearchStatusBadgeProps {
  /** 서버가 문자열 그대로 내려주는 검색 상태 — 'ONE' 외 값(예: 'MANY'/'NONE')도 그대로 받는다. */
  searchState: string;
  total: number;
}

type Tone = 'pending' | 'done' | 'void';

/**
 * 검색 3상태 배지 — 콘솔 전용 사본(staff `components/staff/SearchStatusBadge.tsx`와 로직
 * 동일, `StatePill` 위임뿐이라 이동 비용은 낮지만 `shared/` 승격 대신 사본을 택했다: 승격은
 * staff import 경로 수정이 필요해 타 표면(staff) diff가 함께 발생하지만, 사본은 콘솔로 영향을
 * 완전히 격리한다).
 */
const PRESETS: Record<string, { text: string; tone: Tone }> = {
  ONE: { text: '1건', tone: 'done' },
  MANY: { text: '다건', tone: 'void' },
  NONE: { text: '없음', tone: 'pending' },
};

export function SearchStatusBadge({ searchState, total }: SearchStatusBadgeProps) {
  // 서버가 미리보기 3종 외 값을 내려주는 경우: void(faint) 톤이 가장 가까운 저강조 표현이라 대체 사용
  const preset = PRESETS[searchState] ?? { text: searchState, tone: 'void' as const };
  return (
    <StatePill tone={preset.tone}>
      {preset.text} · {total}건
    </StatePill>
  );
}
