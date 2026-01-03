import { routes } from '@/config/routes';
import { metaObject } from '@/config/site.config';
import PageHeader from '@/app/shared/page-header';
import OdbTable from '@/app/shared/settings/odbs/odb-table';
import WidgetCard from '@core/components/cards/widget-card';

export const metadata = {
  ...metaObject('ODbs'),
};

const pageHeader = {
  title: 'ODbs (Optical Distribution Box/Splitter)',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      name: 'Settings',
    },
    {
      name: 'ODbs',
    },
  ],
};

export default function OdbsPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <WidgetCard title="Manage ODbs" className="mt-6">
        <OdbTable />
      </WidgetCard>
    </>
  );
}
