import { routes } from '@/config/routes';
import { metaObject } from '@/config/site.config';
import PageHeader from '@/app/shared/page-header';
import ZoneTable from '@/app/shared/settings/zones/zone-table';
import WidgetCard from '@core/components/cards/widget-card';

export const metadata = {
  ...metaObject('Zones'),
};

const pageHeader = {
  title: 'Zones',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      name: 'Settings',
    },
    {
      name: 'Zones',
    },
  ],
};

export default function ZonesPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <WidgetCard title="Manage Zones" className="mt-6">
        <ZoneTable />
      </WidgetCard>
    </>
  );
}
