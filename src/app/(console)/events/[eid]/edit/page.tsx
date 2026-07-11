import { EventEditClient } from '@/components/console/EventEditClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function EventEditPage({ params }: PageProps) {
  const { eid } = await params;
  return <EventEditClient eid={eid} />;
}
