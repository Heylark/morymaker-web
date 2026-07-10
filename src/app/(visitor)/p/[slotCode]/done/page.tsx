import { ParkCompleteView } from '@/components/visitor/ParkCompleteView';

interface ParkDonePageProps {
  params: Promise<{ slotCode: string }>;
}

// 얇은 Server 셸 — sessionStorage 판독은 브라우저 전용이라 client 컴포넌트(ParkCompleteView)가 담당한다.
export default async function ParkDonePage({ params }: ParkDonePageProps) {
  const { slotCode } = await params;
  return <ParkCompleteView slotCode={slotCode} />;
}
