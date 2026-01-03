'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Password, Text, Title, ActionIcon } from 'rizzui';
import { changePassword } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';
import { PiX } from 'react-icons/pi';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen]);

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentPassword) {
        setError('Please enter your current password');
        return;
      }

      if (!newPassword) {
        setError('Please enter a new password');
        return;
      }

      if (!validatePassword(newPassword)) {
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      const response = await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.code === 200) {
        toast.success(response.message || 'Password changed successfully');
        onSuccess?.();
        onClose();
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err?.message || 'Failed to change password');
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="m-auto px-7 pt-6 pb-8">
        <div className="mb-7 flex items-center justify-between">
          <Title as="h3">Change Password</Title>
          <ActionIcon
            size="sm"
            variant="text"
            onClick={onClose}
          >
            <PiX className="h-auto w-6" />
          </ActionIcon>
        </div>

        <div className="grid gap-y-6 [&_label>span]:font-medium">
          <Password
            label={<>Current Password <span className="text-red-500">*</span></>}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            disabled={loading}
            inputClassName="border-2"
            size="lg"
          />

          <Password
            label={<>New Password <span className="text-red-500">*</span></>}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            disabled={loading}
            inputClassName="border-2"
            size="lg"
          />

          <div>
            <Password
              label={<>Confirm New Password <span className="text-red-500">*</span></>}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
              inputClassName="border-2"
              size="lg"
            />
            <Text className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, and number
            </Text>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              isLoading={loading}
            >
              Update Password
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
