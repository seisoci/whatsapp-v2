import { routes } from '@/config/routes';
import { metaObject } from '@/config/site.config';
import PageHeader from '@/app/shared/page-header';
import SpeedProfileTable from '@/app/shared/settings/speed-profiles/speed-profile-table';
import WidgetCard from '@core/components/cards/widget-card';

export const metadata = {
  ...metaObject('Speed Profiles'),
};

const pageHeader = {
  title: 'Speed Profiles',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      name: 'Settings',
    },
    {
      name: 'Speed Profiles',
    },
  ],
};

export default function SpeedProfilesPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <WidgetCard title="Manage Speed Profiles" className="mt-6">
        <SpeedProfileTable />
      </WidgetCard>
    </>
  );
}
