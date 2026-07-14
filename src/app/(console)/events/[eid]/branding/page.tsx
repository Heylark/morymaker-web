interface PageProps {
  params: Promise<{ eid: string }>;
}

/**
 * 스캐폴딩 — NAV 항목이 죽은 링크(구현 없이 클릭 시 404)가 되지 않도록 라우트만 먼저 연다.
 * BrandingForm·IdleContentManager를 BrandingClient로 조립하는 작업은 후속 개발에서 이 파일을
 * `<BrandingClient eid={eid} />` 렌더로 교체한다(seats/page.tsx·roster/page.tsx와 동일한
 * 최종 형태 — Server Component가 params만 풀어 Client 컴포넌트에 넘긴다).
 */
export default async function BrandingPage({ params }: PageProps) {
  await params;
  return <p className="text-ink-muted">브랜딩 화면을 준비하고 있습니다.</p>;
}
