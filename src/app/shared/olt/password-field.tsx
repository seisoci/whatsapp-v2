'use client';

import { useState } from 'react';
import { Text, Button } from 'rizzui';
import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';

interface PasswordFieldProps {
  value: string;
  label: string;
}

export default function PasswordField({ value, label }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) {
    return <Text className="font-mono text-base text-gray-400">-</Text>;
  }

  return (
    <div className="flex items-center gap-2">
      <Text className="font-mono text-base">
        {isVisible ? value : '•'.repeat(10)}
      </Text>
      <Button
        variant="text"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="h-auto p-1 text-gray-500 hover:text-gray-700"
        title={isVisible ? 'Hide' : 'Show'}
      >
        {isVisible ? (
          <PiEyeSlashBold className="h-4 w-4" />
        ) : (
          <PiEyeBold className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
