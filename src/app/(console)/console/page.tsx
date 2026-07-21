import { redirect } from 'next/navigation';

// route group((console))은 URL에 영향을 주지 않으므로, 이 하위의 실제 경로 세그먼트(console/)가
// 그룹별 placeholder를 서로 다른 URL로 분리한다. 서브도메인 rewrite로 각 그룹을 루트("/")에
// 매핑하는 것은 후속 REQ 범위 — 그 전까지는 이 경로가 레거시 북마크 목적지다.
//
// 목적지는 /events가 아니라 /landing이다(ADR-020 — ADR-012 DEFAULT_RETURN_TO 변경과 한 쌍).
// returnTo 없이 로그인한 EVENT_STAFF가 ADMIN_ROLES 게이트인 /events로 튕겨 /forbidden에
// 착지하던 현존 결함이, STAFF_ROLES 게이트인 /landing으로 바뀌며 함께 해소된다.
export default function ConsolePage() {
  redirect('/landing');
}
