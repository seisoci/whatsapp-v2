'use client';

import { useState } from 'react';
import { Select, Button } from 'rizzui';
import { PiXBold } from 'react-icons/pi';

interface TemplatesFiltersProps {
  phoneNumbers: { value: string; label: string }[];
  onFilter: (filters: {
    category: string;
    status: string;
    phoneNumberId: string;
  }) => void;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'IN_APPEAL', label: 'In Appeal' },
];

export default function TemplatesFilters({
  phoneNumbers,
  onFilter,
}: TemplatesFiltersProps) {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilter({ category: value, status, phoneNumberId });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilter({ category, status: value, phoneNumberId });
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumberId(value);
    onFilter({ category, status, phoneNumberId: value });
  };

  const handleReset = () => {
    setCategory('');
    setStatus('');
    setPhoneNumberId('');
    onFilter({ category: '', status: '', phoneNumberId: '' });
  };

  const hasActiveFilters = category || status || phoneNumberId;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-auto sm:min-w-[200px]">
        <Select
          label="Category"
          placeholder="Select category"
          options={categoryOptions}
          value={category}
          onChange={handleCategoryChange}
          getOptionValue={(option) => option.value}
          displayValue={(selected) =>
            categoryOptions.find((option) => option.value === selected)?.label ?? 'All Categories'
          }
        />
      </div>

      <div className="w-full sm:w-auto sm:min-w-[200px]">
        <Select
          label="Status"
          placeholder="Select status"
          options={statusOptions}
          value={status}
          onChange={handleStatusChange}
          getOptionValue={(option) => option.value}
          displayValue={(selected) =>
            statusOptions.find((option) => option.value === selected)?.label ?? 'All Status'
          }
        />
      </div>

      <div className="w-full sm:w-auto sm:min-w-[200px]">
        <Select
          label="Phone Number"
          placeholder="Select phone number"
          options={[{ value: '', label: 'All Phone Numbers' }, ...phoneNumbers]}
          value={phoneNumberId}
          onChange={handlePhoneNumberChange}
          getOptionValue={(option) => option.value}
          displayValue={(selected) =>
            selected
              ? phoneNumbers.find((option) => option.value === selected)?.label ?? 'All Phone Numbers'
              : 'All Phone Numbers'
          }
        />
      </div>

      {hasActiveFilters && (
        <Button
          size="lg"
          variant="flat"
          onClick={handleReset}
          className="h-11"
        >
          <PiXBold className="mr-1.5 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
