import SystemInfoWidget from '@/app/shared/widgets/system-info-widget';
import OltSummaryCard from '@/app/shared/file/dashboard/olt-summary-card';

export default function FileDashboard() {
  return (
    <div className="@container">
      <SystemInfoWidget />
      <div className="mb-6 mt-5 grid grid-cols-1 gap-6 @container 2xl:mb-8 2xl:mt-8 2xl:gap-8 md:grid-cols-2">
        <OltSummaryCard className="col-span-1" />
      </div>
    </div>
  );
}
