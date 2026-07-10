import { redirect } from 'next/navigation';

// route group((staff))은 URL에 영향을 주지 않으므로, 이 하위의 실제 경로 세그먼트(staff/)가
// 그룹별 placeholder를 서로 다른 URL로 분리한다. `/staff` 진입은 업무 선택 홈(`/staff/home`)으로
// 즉시 보낸다 — trade-off 없는 라우팅 편의(설계 결정 불요).
export default function StaffPage() {
  redirect('/staff/home');
}
