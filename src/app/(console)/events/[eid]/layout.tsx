import { EventConsoleShell } from '@/components/console/EventConsoleShell';

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eid: string }>;
}

/**
 * eid 컨텍스트 셸의 서버측 진입점 — params에서 eid만 뽑아 클라 셸에 넘긴다. 이벤트 조회 자체는
 * 서버에서 하지 않는다: 서버 컴포넌트는 BFF 프록시가 유일하게 처리하는 토큰 회전 계약(쿠키
 * set)을 수행할 수 없어, 회전된 refresh_token을 저장하지 못하면 family-kill 위험으로 이어진다.
 */
export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { eid } = await params;
  return <EventConsoleShell eid={eid}>{children}</EventConsoleShell>;
}
