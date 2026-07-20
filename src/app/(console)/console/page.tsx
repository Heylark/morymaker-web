import { redirect } from 'next/navigation';

// route group((console))은 URL에 영향을 주지 않으므로, 이 하위의 실제 경로 세그먼트(console/)가
// 그룹별 placeholder를 서로 다른 URL로 분리한다. 서브도메인 rewrite로 각 그룹을 루트("/")에
// 매핑하는 것은 후속 REQ 범위 — 그 전까지는 이 경로가 로그인 후 기본 랜딩 지점이다.
//
// 목록 화면 자체는 canonical 경로 /events로 이전했다 — 이 페이지는 레거시 북마크·기본 랜딩을
// 그대로 목적지로 넘기는 얇은 리다이렉트만 담당한다.
export default function ConsolePage() {
  redirect('/events');
}
