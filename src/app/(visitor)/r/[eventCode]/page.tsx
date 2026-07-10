import { OnsiteRegister } from '@/components/visitor/OnsiteRegister';

interface OnsiteRegisterPageProps {
  params: Promise<{ eventCode: string }>;
}

// 얇은 Server 셸 — 데이터 페칭·인터랙션은 client 컴포넌트(OnsiteRegister)가 담당한다.
export default async function OnsiteRegisterPage({ params }: OnsiteRegisterPageProps) {
  const { eventCode } = await params;
  return <OnsiteRegister eventCode={eventCode} />;
}
