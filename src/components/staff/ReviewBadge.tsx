/** 셀프 승계 자동출차 발생 자리(요원 사후 확인 필요)를 표시하는 배지 — PRK-01 보드·PRK-02 상세 공용. */
export function ReviewBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-state-review/10 px-3 py-1 text-sm font-medium text-state-review">
      확인 필요
    </span>
  );
}
