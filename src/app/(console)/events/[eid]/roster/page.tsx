import { RosterClient } from '@/components/console/RosterClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function RosterPage({ params }: PageProps) {
  const { eid } = await params;
  return <RosterClient eid={eid} />;
}
