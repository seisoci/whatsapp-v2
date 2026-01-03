'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Select } from 'rizzui';
import { updateOnuSpeedProfiles, getSpeedProfiles } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';

interface SelectOption {
  value: string | number;
  label: string;
}

interface UpdateSpeedProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  currentDownloadId: string;
  currentUploadId: string;
  onSuccess: () => void;
}

export default function UpdateSpeedProfilesModal({
  isOpen,
  onClose,
  onuId,
  currentDownloadId,
  currentUploadId,
  onSuccess,
}: UpdateSpeedProfilesModalProps) {
  const [loading, setLoading] = useState(false);
  const [downloadSpeedId, setDownloadSpeedId] = useState(currentDownloadId);
  const [uploadSpeedId, setUploadSpeedId] = useState(currentUploadId);
  const [downloadOptions, setDownloadOptions] = useState<SelectOption[]>([]);
  const [uploadOptions, setUploadOptions] = useState<SelectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    setDownloadSpeedId(currentDownloadId);
    setUploadSpeedId(currentUploadId);
  }, [currentDownloadId, currentUploadId]);

  useEffect(() => {
    if (isOpen) {
      fetchSpeedProfiles();
    }
  }, [isOpen]);

  const fetchSpeedProfiles = async () => {
    try {
      setLoadingOptions(true);

      const [downloadResponse, uploadResponse] = await Promise.all([
        getSpeedProfiles('download'),
        getSpeedProfiles('upload')
      ]);

      if (downloadResponse.code === 200 && downloadResponse.data) {
        const downloads = downloadResponse.data.map((profile: any) => ({
          value: profile.id,
          label: profile.name,
        }));
        setDownloadOptions(downloads);
      }

      if (uploadResponse.code === 200 && uploadResponse.data) {
        const uploads = uploadResponse.data.map((profile: any) => ({
          value: profile.id,
          label: profile.name,
        }));
        setUploadOptions(uploads);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load speed profiles');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!downloadSpeedId || !uploadSpeedId) {
      toast.error('Please select both download and upload speeds');
      return;
    }

    try {
      setLoading(true);
      const response = await updateOnuSpeedProfiles(onuId, {
        download_speed_id: downloadSpeedId,
        upload_speed_id: uploadSpeedId,
      });

      if (response.code === 200) {
        toast.success('Speed profiles updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to update speed profiles');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update speed profiles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Configure Speed Profiles
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Download Speed */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Download Speed *
            </label>
            <Select
              options={downloadOptions}
              value={downloadSpeedId ? Number(downloadSpeedId) : null}
              onChange={(value) => setDownloadSpeedId(value ? value.toString() : '')}
              placeholder={loadingOptions ? 'Loading...' : 'Select Download Speed'}
              getOptionValue={(option) => option.value}
              displayValue={(selected: number) =>
                downloadOptions.find((opt) => opt.value === selected)?.label ?? ''
              }
              disabled={loadingOptions}
              clearable
              searchable
            />
          </div>

          {/* Upload Speed */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Upload Speed *
            </label>
            <Select
              options={uploadOptions}
              value={uploadSpeedId ? Number(uploadSpeedId) : null}
              onChange={(value) => setUploadSpeedId(value ? value.toString() : '')}
              placeholder={loadingOptions ? 'Loading...' : 'Select Upload Speed'}
              getOptionValue={(option) => option.value}
              displayValue={(selected: number) =>
                uploadOptions.find((opt) => opt.value === selected)?.label ?? ''
              }
              disabled={loadingOptions}
              clearable
              searchable
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingOptions}
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
