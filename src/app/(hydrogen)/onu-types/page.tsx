import { routes } from '@/config/routes';
import { metaObject } from '@/config/site.config';
import PageHeader from '@/app/shared/page-header';
import OnuTypeTable from '@/app/shared/settings/onu-types/onu-type-table';
import WidgetCard from '@core/components/cards/widget-card';

export const metadata = {
  ...metaObject('ONU Types'),
};

const pageHeader = {
  title: 'ONU Device Types',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      name: 'Settings',
    },
    {
      name: 'ONU Types',
    },
  ],
};

export default function OnuTypesPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <WidgetCard title="Manage ONU Device Types" className="mt-6">
        <OnuTypeTable />
      </WidgetCard>
    </>
  );
}
