import { PersonalHub } from '@/components/visitor/PersonalHub';

interface PersonalHubPageProps {
  params: Promise<{ token: string }>;
}

// 얇은 Server 셸 — 데이터 페칭·인터랙션은 client 컴포넌트(PersonalHub)가 담당한다.
export default async function PersonalHubPage({ params }: PersonalHubPageProps) {
  const { token } = await params;
  return <PersonalHub token={token} />;
}
