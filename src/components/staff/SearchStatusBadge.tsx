import { StatePill } from '@/components/shared/StatePill';

interface SearchStatusBadgeProps {
  /** 서버가 문자열 그대로 내려주는 검색 상태 — 'ONE' 외 값(예: 'MANY'/'NONE')도 그대로 받는다. */
  searchState: string;
  total: number;
}

type Tone = 'pending' | 'done' | 'void';

/**
 * 검색 3상태 배지 — 주차 상태(빈자리/주차중/확인필요)와 동일 의미 톤을 공유한다:
 * ONE(1건)=state-active→done(ivory), MANY(다건)=state-review→void(faint), NONE(없음)=state-empty→pending(champagne,
 * 기본 톤). 3색 팔레트가 톤 3단계로 전환되어도 색+텍스트 이중 표기 원칙(색맹 대비)은 라벨 문구로 유지한다.
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
