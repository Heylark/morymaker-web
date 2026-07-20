import { ZoneDetailClient } from '@/components/console/ZoneDetailClient';

interface PageProps {
  params: Promise<{ eid: string; zid: string }>;
}

export default async function ZoneDetailPage({ params }: PageProps) {
  const { eid, zid } = await params;
  return <ZoneDetailClient eid={eid} zid={zid} />;
}
