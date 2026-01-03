import { use } from 'react';
import { routes } from '@/config/routes';
import PageHeader from '@/app/shared/page-header';
import OltNavigation from '@/app/shared/olt/olt-navigation';

const pageHeader = {
  title: 'OLT Details',
  breadcrumb: [
    {
      href: routes.eCommerce.dashboard,
      name: 'Home',
    },
    {
      href: routes.olt.dashboard,
      name: 'OLT',
    },
    {
      name: 'Details',
    },
  ],
};

export default function OltDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
      <OltNavigation oltId={resolvedParams.id} />
      {children}
    </>
  );
}
