import { HistoryClient } from '@/components/console/HistoryClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function RosterHistoryPage({ params }: PageProps) {
  const { eid } = await params;
  return <HistoryClient eid={eid} />;
}
