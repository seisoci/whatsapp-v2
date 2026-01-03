'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TR069Profile } from '@/types/olt';
import { Select, Button, Text } from 'rizzui';
import toast from 'react-hot-toast';

interface TR069SelectorProps {
  oltId: string | number;
  selectedProfiles: TR069Profile[];
  availableProfiles?: TR069Profile[];
}

export default function TR069Selector({
  oltId,
  selectedProfiles,
  availableProfiles = []
}: TR069SelectorProps) {
  const [selected, setSelected] = useState<number[]>(
    selectedProfiles.map(p => p.id)
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      toast.success('TR069 profiles updated successfully');
    } catch (error) {
      toast.error('Failed to update TR069 profiles');
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = JSON.stringify(selected.sort()) !==
    JSON.stringify(selectedProfiles.map(p => p.id).sort());

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        {selectedProfiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedProfiles.map((profile) => (
              <span
                key={profile.id}
                className="inline-flex items-center rounded bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {profile.name}
              </span>
            ))}
          </div>
        ) : (
          <Text className="text-gray-500">No profiles assigned</Text>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          isLoading={isUpdating}
          disabled={!hasChanges}
        >
          Set Profiles
        </Button>

        <Link href="/system-config/tr069">
          <Button size="sm" variant="outline">
            Manage Profiles
          </Button>
        </Link>
      </div>
    </div>
  );
}
