interface SlotAutoLabelProps {
  fullName: string; // 서버 조립 표시명(slotFullName) — 그대로 렌더, 파생 금지
}

/**
 * 자리명 표시(공유 후보 — 이번 REQ는 ADM-07 소비만). 서버가 조립한 slotFullName을 그대로
 * 렌더한다. part1~4 공백결합·'야외' substring 등 파생 로직을 프론트에서 재구현하지 않는다.
 * 다른 화면 통합 시 components/shared/로 승격(파일 이동만) — 이번 범위 밖.
 */
export function SlotAutoLabel({ fullName }: SlotAutoLabelProps) {
  return <span className="text-sm font-medium text-ink">{fullName}</span>;
}
