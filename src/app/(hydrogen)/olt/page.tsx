import { routes } from '@/config/routes';
import { metaObject } from '@/config/site.config';
import PageHeader from '@/app/shared/page-header';
import OltTable from '@/app/shared/olt/olt-table';
import WidgetCard from '@core/components/cards/widget-card';

export const metadata = {
  ...metaObject('OLT Management'),
};

const pageHeader = {
  title: 'OLT Management',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      name: 'OLT',
    },
  ],
};

export default function OltPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <WidgetCard title="OLT Devices" className="mt-6">
        <OltTable />
      </WidgetCard>
    </>
  );
}
