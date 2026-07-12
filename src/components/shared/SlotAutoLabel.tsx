import { Num } from '@/components/shared/KVRow';

interface SlotAutoLabelProps {
  fullName: string; // 서버 조립 표시명(slotFullName) — 그대로 렌더, 파생 금지
}

/**
 * 자리명 표시(공유 컴포넌트 — 콘솔 QR 그리드·방문자 셀프 주차 폼 공용). 서버가 조립한
 * slotFullName을 그대로 렌더한다. part1~4 공백결합·'야외' substring 등 파생 로직을 프론트에서
 * 재구현하지 않는다. key-value row의 숫자 각인 primitive를 라벨 전체에 적용한다 — 서버 문자열이
 * 안내문과 자리번호를 이미 한 덩어리로 조립해 내려주므로 부분 분리 없이 통째로 세리프 골드 강조한다.
 */
export function SlotAutoLabel({ fullName }: SlotAutoLabelProps) {
  return <Num>{fullName}</Num>;
}
