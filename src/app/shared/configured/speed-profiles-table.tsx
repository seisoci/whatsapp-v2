'use client';

import { useEffect, useState } from 'react';
import { getOnuSpeedProfiles } from '@/lib/sanctum-api';
import { Loader, Text, Button } from 'rizzui';
import { PiPlusCircle } from 'react-icons/pi';
import UpdateSpeedProfilesModal from './update-speed-profiles-modal';

interface SpeedProfilesTableProps {
  onuId: string;
}

export default function SpeedProfilesTable({ onuId }: SpeedProfilesTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<{ id: number; name: string } | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<{ id: number; name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSpeedProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOnuSpeedProfiles(onuId);

      if (response.code === 200 && response.data) {
        setDownloadSpeed({
          id: response.data.download_speed_id,
          name: response.data.download_speed_name
        });
        setUploadSpeed({
          id: response.data.upload_speed_id,
          name: response.data.upload_speed_name
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load speed profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeedProfiles();
  }, [onuId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <Text className="text-sm text-red-600">{error}</Text>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Download
              </th>
              <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Upload
              </th>
              <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-sm text-gray-900">
                {downloadSpeed?.name || 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {uploadSpeed?.name || 'N/A'}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="text"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => setShowModal(true)}
                >
                  <PiPlusCircle className="mr-1 h-4 w-4" />
                  Configure
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <UpdateSpeedProfilesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onuId={onuId}
        currentDownloadId={downloadSpeed?.id?.toString() || ''}
        currentUploadId={uploadSpeed?.id?.toString() || ''}
        onSuccess={() => {
          fetchSpeedProfiles();
        }}
      />
    </>
  );
}
