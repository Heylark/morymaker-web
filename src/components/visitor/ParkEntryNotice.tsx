/**
 * 주차 진입 안내(비클릭 — 비활성 버튼 아님). 셀프 주차 등록 화면(VIS-01, `/p/{slotCode}`)이
 * 아직 없어 목적지가 없다 — 비활성 버튼도 "눌러지는 것처럼 보이는" 죽은 affordance라
 * 안내문구로 대체한다. VIS-01 도입 시 실 버튼으로 교체한다.
 */
export function ParkEntryNotice() {
  return (
    <div className="rounded-card bg-surface-sunken p-4 text-center">
      <p className="text-sm text-ink-muted">주차 안내는 현장 안내데스크에서 도와드립니다.</p>
    </div>
  );
}
