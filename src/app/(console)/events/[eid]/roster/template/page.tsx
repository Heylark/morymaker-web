import { TemplateClient } from '@/components/console/TemplateClient';

interface PageProps {
  params: Promise<{ eid: string }>;
}

export default async function RosterTemplatePage({ params }: PageProps) {
  const { eid } = await params;
  return <TemplateClient eid={eid} />;
}
