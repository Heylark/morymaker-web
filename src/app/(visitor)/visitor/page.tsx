// route group((visitor))은 URL에 영향을 주지 않으므로, 이 하위의 실제 경로 세그먼트(visitor/)가
// 그룹별 placeholder를 서로 다른 URL로 분리한다. 서브도메인 rewrite로 각 그룹을 루트("/")에
// 매핑하는 것은 후속 REQ 범위 — 그 전까지는 이 경로가 임시 접근 지점이다.
export default function VisitorPage() {
  return <p>방문자 웹 — 골격 placeholder</p>;
}
