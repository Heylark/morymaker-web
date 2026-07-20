import { ZoneList } from '@/components/console/ZoneList';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function ParkingZonesPage({ params }: PageProps) {
  const { eid } = await params;
  return <ZoneList eid={eid} />;
}
