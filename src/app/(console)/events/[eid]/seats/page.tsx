import { SeatsClient } from '@/components/console/SeatsClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function SeatsPage({ params }: PageProps) {
  const { eid } = await params;
  return <SeatsClient eid={eid} />;
}
