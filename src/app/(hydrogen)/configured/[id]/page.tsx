import { metaObject } from '@/config/site.config';
import OnuDetailView from '@/app/shared/configured/onu-detail';

export const metadata = {
  ...metaObject('ONU Detail'),
};

export default async function OnuDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  return <OnuDetailView onuId={id} />;
}
