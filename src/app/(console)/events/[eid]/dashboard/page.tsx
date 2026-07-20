import { DashboardClient } from '@/components/console/DashboardClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { eid } = await params;
  return <DashboardClient eid={eid} />;
}
