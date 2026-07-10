interface SlotAutoLabelProps {
  fullName: string; // 서버 조립 표시명(slotFullName) — 그대로 렌더, 파생 금지
}

/**
 * 자리명 표시(공유 컴포넌트 — 콘솔 QR 그리드·방문자 셀프 주차 폼 공용). 서버가 조립한
 * slotFullName을 그대로 렌더한다. part1~4 공백결합·'야외' substring 등 파생 로직을 프론트에서
 * 재구현하지 않는다.
 */
export function SlotAutoLabel({ fullName }: SlotAutoLabelProps) {
  return <span className="text-sm font-medium text-ink">{fullName}</span>;
}
