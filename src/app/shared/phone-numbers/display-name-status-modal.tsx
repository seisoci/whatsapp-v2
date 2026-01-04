'use client';

import { useEffect, useState } from 'react';
import { Button, Text, Loader, Badge } from 'rizzui';
import { phoneNumbersApi } from '@/lib/api-client';
import { PhoneNumber } from './index';
import toast from 'react-hot-toast';

interface DisplayNameStatusModalProps {
  phoneNumber: PhoneNumber;
  onClose?: () => void;
}

interface BusinessProfileData {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  messaging_product?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

export default function DisplayNameStatusModal({
  phoneNumber,
  onClose,
}: DisplayNameStatusModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<BusinessProfileData | null>(null);

  useEffect(() => {
    fetchDisplayNameStatus();
  }, []);

  const fetchDisplayNameStatus = async () => {
    setIsLoading(true);
    try {
      const response = await phoneNumbersApi.getDisplayNameStatus(phoneNumber.id);

      if (response.success && response.data) {
        setProfileData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch display name status');
      }
    } catch (error: any) {
      console.error('Display name status error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch display name status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-auto p-6">
      <Text className="mb-6 text-lg font-semibold">Business Profile Status</Text>

      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <Text className="text-sm font-medium text-gray-700">Phone Number</Text>
        <Text className="text-sm text-gray-600">
          {phoneNumber.displayPhoneNumber || phoneNumber.phoneNumberId}
        </Text>
        {phoneNumber.verifiedName && (
          <>
            <Text className="mt-2 text-sm font-medium text-gray-700">Verified Name</Text>
            <div className="flex items-center gap-2">
              <Text className="text-sm text-gray-600">{phoneNumber.verifiedName}</Text>
              <Badge color="success" size="sm">Verified</Badge>
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader variant="spinner" size="lg" />
        </div>
      ) : profileData ? (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              {profileData.about && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    About
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profileData.about}
                  </td>
                </tr>
              )}

              {profileData.description && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Description
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profileData.description}
                  </td>
                </tr>
              )}

              {profileData.address && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Address
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profileData.address}
                  </td>
                </tr>
              )}

              {profileData.email && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Email
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profileData.email}
                  </td>
                </tr>
              )}

              {profileData.vertical && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Business Category
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profileData.vertical}
                  </td>
                </tr>
              )}

              {profileData.websites && profileData.websites.length > 0 && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Websites
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="space-y-1">
                      {profileData.websites.map((website, index) => (
                        <a
                          key={index}
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline"
                        >
                          {website}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {profileData.profile_picture_url && (
                <tr>
                  <td className="w-1/3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    Profile Picture
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={profileData.profile_picture_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!profileData.about &&
           !profileData.description &&
           !profileData.address &&
           !profileData.email &&
           !profileData.websites?.length &&
           !profileData.vertical &&
           !profileData.profile_picture_url && (
            <div className="bg-gray-50 p-8 text-center">
              <Text className="text-sm text-gray-600">No business profile information available</Text>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-red-50 p-4">
          <Text className="text-sm text-red-800">Failed to load business profile data</Text>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
