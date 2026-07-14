import { BrandingClient } from '@/components/console/BrandingClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function BrandingPage({ params }: PageProps) {
  const { eid } = await params;
  return <BrandingClient eid={eid} />;
}
