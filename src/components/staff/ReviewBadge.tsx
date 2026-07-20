import { StatePill } from '@/components/shared/StatePill';

/** 셀프 승계 자동출차 발생 자리(요원 사후 확인 필요)를 표시하는 배지 — PRK-01 보드·PRK-02 상세 공용. */
export function ReviewBadge() {
  return <StatePill tone="done">확인 필요</StatePill>;
}
