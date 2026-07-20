import { CompleteView } from '@/components/visitor/CompleteView';

interface OnsiteDonePageProps {
  params: Promise<{ eventCode: string }>;
}

// 얇은 Server 셸 — sessionStorage 판독은 브라우저 전용이라 client 컴포넌트(CompleteView)가 담당한다.
export default async function OnsiteDonePage({ params }: OnsiteDonePageProps) {
  const { eventCode } = await params;
  return <CompleteView eventCode={eventCode} />;
}
