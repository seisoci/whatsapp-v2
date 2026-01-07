'use client';

import { useState, useRef, useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button, Input, Textarea, Text, Loader } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { PhoneNumber } from './index';
import toast from 'react-hot-toast';
import { PiPlus, PiX, PiUpload, PiTrash, PiImage } from 'react-icons/pi';

const editBusinessProfileSchema = z.object({
  about: z.string().max(139, 'About must be 139 characters or less').optional(),
  address: z.string().max(256, 'Address must be 256 characters or less').optional(),
  description: z.string().max(512, 'Description must be 512 characters or less').optional(),
  email: z.string().max(128, 'Email must be 128 characters or less').optional().or(z.literal('')),
  vertical: z.string().optional(),
  websites: z.array(z.string().url('Invalid URL')).optional(),
});

type EditBusinessProfileInput = z.infer<typeof editBusinessProfileSchema>;

interface EditBusinessProfileModalProps {
  phoneNumber: PhoneNumber;
  onSuccess?: () => void;
  onClose?: () => void;
}

const verticalOptions = [
  { value: '', label: 'Select Category' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'BEAUTY', label: 'Beauty, Spa and Salon' },
  { value: 'APPAREL', label: 'Clothing and Apparel' },
  { value: 'EDU', label: 'Education' },
  { value: 'ENTERTAIN', label: 'Entertainment' },
  { value: 'EVENT_PLAN', label: 'Event Planning and Service' },
  { value: 'FINANCE', label: 'Finance and Banking' },
  { value: 'GROCERY', label: 'Food and Grocery' },
  { value: 'GOVT', label: 'Public Service' },
  { value: 'HOTEL', label: 'Hotel and Lodging' },
  { value: 'HEALTH', label: 'Medical and Health' },
  { value: 'NONPROFIT', label: 'Non-profit' },
  { value: 'PROF_SERVICES', label: 'Professional Services' },
  { value: 'RETAIL', label: 'Shopping and Retail' },
  { value: 'TRAVEL', label: 'Travel and Transportation' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'OTHER', label: 'Other' },
];

export default function EditBusinessProfileModal({
  phoneNumber,
  onSuccess,
  onClose,
}: EditBusinessProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [websites, setWebsites] = useState<string[]>(['']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<EditBusinessProfileInput>({
    resolver: zodResolver(editBusinessProfileSchema),
    defaultValues: {
      about: '',
      address: '',
      description: '',
      email: '',
      vertical: '',
      websites: [''],
    },
  });

  // Fetch existing business profile data
  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    setIsFetchingProfile(true);
    try {
      const response = await phoneNumbersApi.getDisplayNameStatus(phoneNumber.id);

      if (response.success && response.data) {
        const profileData = response.data;

        // Set form values
        if (profileData.about) setValue('about', profileData.about);
        if (profileData.address) setValue('address', profileData.address);
        if (profileData.description) setValue('description', profileData.description);
        if (profileData.email) setValue('email', profileData.email);
        if (profileData.vertical) setValue('vertical', profileData.vertical);

        // Set websites
        if (profileData.websites && profileData.websites.length > 0) {
          setWebsites(profileData.websites);
          setValue('websites', profileData.websites);
        }

        // Set current profile picture
        if (profileData.profile_picture_url) {
          setCurrentProfilePicture(profileData.profile_picture_url);
        }
      }
    } catch (error: any) {
      console.error('Fetch business profile error:', error);
      toast.error('Failed to load current business profile data');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const addWebsite = () => {
    if (websites.length < 2) {
      const newWebsites = [...websites, ''];
      setWebsites(newWebsites);
      setValue('websites', newWebsites);
    }
  };

  const removeWebsite = (index: number) => {
    const newWebsites = websites.filter((_, i) => i !== index);
    setWebsites(newWebsites);
    setValue('websites', newWebsites);
  };

  const updateWebsite = (index: number, value: string) => {
    const newWebsites = [...websites];
    newWebsites[index] = value;
    setWebsites(newWebsites);
    setValue('websites', newWebsites);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const response = await phoneNumbersApi.uploadProfilePicture(phoneNumber.id, selectedFile);

      if (response.success) {
        toast.success('Profile picture uploaded successfully!');
        setSelectedFile(null);
        setFilePreview(null);
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Upload photo error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete the profile picture?')) {
      return;
    }

    setIsDeletingPhoto(true);
    try {
      const response = await phoneNumbersApi.deleteProfilePicture(phoneNumber.id);

      if (response.success) {
        toast.success('Profile picture deleted successfully!');
        setCurrentProfilePicture(null);
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to delete profile picture');
      }
    } catch (error: any) {
      console.error('Delete photo error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const onSubmit: SubmitHandler<EditBusinessProfileInput> = async (data) => {
    setIsLoading(true);
    try {
      // Filter out empty websites
      const validWebsites = websites.filter(w => w.trim() !== '');

      const profileData: any = {};

      if (data.about) profileData.about = data.about;
      if (data.address) profileData.address = data.address;
      if (data.description) profileData.description = data.description;
      if (data.email) profileData.email = data.email;
      if (data.vertical) profileData.vertical = data.vertical;
      if (validWebsites.length > 0) profileData.websites = validWebsites;

      const response = await phoneNumbersApi.updateBusinessProfile(phoneNumber.id, profileData);

      if (response.success) {
        toast.success('Business profile updated successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to update business profile');
      }
    } catch (error: any) {
      console.error('Update business profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update business profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingProfile) {
    return (
      <div className="m-auto p-6">
        <Text className="mb-6 text-lg font-semibold">Edit Business Profile</Text>
        <div className="flex items-center justify-center py-12">
          <Loader variant="spinner" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto p-6">
      <Text className="mb-6 text-lg font-semibold">Edit Business Profile</Text>

      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <Text className="text-sm font-medium text-gray-700">Phone Number</Text>
        <Text className="text-sm text-gray-600">
          {phoneNumber.displayPhoneNumber || phoneNumber.phoneNumberId}
        </Text>
        {phoneNumber.verifiedName && (
          <>
            <Text className="mt-2 text-sm font-medium text-gray-700">Verified Name</Text>
            <Text className="text-sm text-gray-600">{phoneNumber.verifiedName}</Text>
          </>
        )}
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 p-4">
        <Text className="text-sm font-medium text-blue-800">Important Notes:</Text>
        <ul className="mt-1 list-inside list-disc text-sm text-blue-700">
          <li>About: Max 139 characters (shown in chat list)</li>
          <li>Description: Max 512 characters (shown in business info)</li>
          <li>Address: Max 256 characters</li>
          <li>Websites: Maximum 2 URLs</li>
          <li>Profile Picture: Max 5MB, JPEG/PNG only</li>
        </ul>
      </div>

      {/* Profile Picture Upload Section */}
      <div className="mb-5 rounded-lg border border-gray-200 p-4">
        <Text className="mb-3 text-sm font-medium text-gray-900">Profile Picture</Text>

        {/* Show current profile picture if exists */}
        {currentProfilePicture && !filePreview && (
          <div className="mb-3">
            <Text className="mb-2 text-xs text-gray-500">Current Picture:</Text>
            <img
              src={currentProfilePicture}
              alt="Current Profile"
              className="h-24 w-24 rounded-lg border border-gray-300 object-cover"
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        {filePreview ? (
          <div className="space-y-3">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-300">
              <img
                src={filePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleUploadPhoto}
                isLoading={isUploadingPhoto}
                disabled={isUploadingPhoto || isDeletingPhoto}
              >
                <PiUpload className="mr-1 h-4 w-4" />
                Upload Photo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploadingPhoto || isDeletingPhoto}
              >
                <PiX className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto || isDeletingPhoto}
            >
              <PiImage className="mr-1 h-4 w-4" />
              Choose Photo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              color="danger"
              onClick={handleDeletePhoto}
              isLoading={isDeletingPhoto}
              disabled={isUploadingPhoto || isDeletingPhoto}
            >
              <PiTrash className="mr-1 h-4 w-4" />
              Delete Current Photo
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="about"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              label="About (Status)"
              placeholder="e.g., Welcome to our business!"
              error={errors.about?.message}
              rows={2}
              helperText={`${field.value?.length || 0}/139 characters`}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              label="Description"
              placeholder="Describe your business..."
              error={errors.description?.message}
              rows={4}
              helperText={`${field.value?.length || 0}/512 characters`}
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Address"
              placeholder="123 Main St, City, Country"
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Email"
              placeholder="business@example.com"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          name="vertical"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900">
                Business Category
              </label>
              <select
                {...field}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {verticalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.vertical && (
                <Text className="mt-1 text-xs text-red-500">{errors.vertical.message}</Text>
              )}
            </div>
          )}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">Websites</label>
            {websites.length < 2 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addWebsite}
                className="h-7"
              >
                <PiPlus className="mr-1 h-3 w-3" />
                Add Website
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {websites.map((website, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={website}
                  onChange={(e) => updateWebsite(index, e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                {websites.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    color="danger"
                    onClick={() => removeWebsite(index)}
                    className="h-10 w-10 p-0"
                  >
                    <PiX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.websites && (
            <Text className="mt-1 text-xs text-red-500">
              {errors.websites.message || 'Please enter valid URLs'}
            </Text>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
