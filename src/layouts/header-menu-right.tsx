'use client';

import ProfileMenu from '@/layouts/profile-menu';
import SettingsButton from '@/layouts/settings-button';

export default function HeaderMenuRight() {
  return (
    <div className="ms-auto flex shrink-0 items-center gap-2 text-gray-700 xs:gap-3 xl:gap-4">
      <SettingsButton />
      <ProfileMenu />
    </div>
  );
}
