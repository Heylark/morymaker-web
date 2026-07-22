import { ConsoleShell } from '@/components/console/shell/ConsoleShell';

/**
 * `scan`·`scan/confirm` 전용 nested layout — CP-1 Q4=A(scan + scan/confirm 함께 셸 편입)에
 * 따라 `(staff)` 그룹 전체가 아니라 이 하위 트리에만 `ConsoleShell`을 부착한다. `data-console-scope`
 * 마커는 렌더하지 않는다(핸드오프 §2 "마커 생략 가능" — 스태프는 콘솔과 다른 비대칭이 기존에도
 * 있었다). `StaffEventProvider`(상위 `(staff)/gate-client.tsx`)가 이 layout보다 위에 있으므로,
 * 비-ready 3분기(SYSTEM_ADMIN·배정 0/2+건)에서는 이 셸 자체가 렌더되지 않는다.
 */
export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
