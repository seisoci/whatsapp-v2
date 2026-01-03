'use client';

import { useState } from 'react';
import { Button, Text } from 'rizzui';
import {
  PiListChecks,
  PiCaretRight,
  PiClockCounterClockwise,
  PiInfo,
  PiGear
} from 'react-icons/pi';
import cn from '@core/utils/class-names';
import { submitBatchAction } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';

interface BatchActionsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: {
    search?: string;
    status?: string;
    olt_id?: string;
    zone_id?: string;
    odb_id?: string;
    board?: string;
    port?: string;
    signal_filter?: string;
    pon_type?: string;
  };
  totalRecords: number;
}

export default function BatchActionsPanel({
  isOpen,
  onToggle,
  filters,
  totalRecords,
}: BatchActionsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Form states
  const [tr069Enabled, setTr069Enabled] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if OLT is selected
  const isOltSelected = !!filters.olt_id;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyAction = async (action: string, params: any = {}) => {
    if (!isOltSelected) {
      toast.error('Please select an OLT first.');
      return;
    }

    if (totalRecords === 0) {
      toast.error('No ONUs selected. Please apply filters to select ONUs.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitBatchAction({
        action,
        filters,
        params,
      });

      toast.success(response?.message || 'Batch action submitted successfully!');

      // Optionally close the expanded section
      // setExpandedSections({});
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit batch action');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-md overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2">
              <PiListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text className="font-semibold text-gray-900">Batch Actions</Text>
              <Text className="text-xs text-gray-500">Perform bulk operations on selected ONUs</Text>
            </div>
          </div>
          <a
            href="/reports/tasks"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button color="primary" size="sm" variant="outline" className="gap-1.5">
              <PiClockCounterClockwise className="h-4 w-4" />
              History
            </Button>
          </a>
        </div>
      </div>

      <div className="p-5">
        {/* Active Batch Tasks Section */}
        <div className="mb-4 hidden" id="active-batch-tasks">
          <div className="mb-2 flex items-center justify-between rounded-lg bg-red-50 p-3">
            <Text className="font-medium flex items-center gap-2 text-sm text-red-900">
              <PiListChecks className="h-4 w-4" />
              Active Batch Tasks
            </Text>
            <Button color="danger" size="sm" disabled>
              Stop batch actions
            </Button>
          </div>
          <div id="active-batch-tasks-list"></div>
        </div>

        {/* Info Section */}
        <div className="mb-5 rounded-lg bg-blue-50 border border-blue-100 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <div className="rounded-md bg-blue-100 p-1.5 mt-0.5">
                <PiInfo className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <Text className="text-sm text-gray-700 leading-relaxed">
                  Select ONUs using the filters above, then choose an action to perform on all matching ONUs.
                </Text>
                <span id="batch-actions-count" className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  {totalRecords} ONUs selected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="space-y-3">
          {/* Change TR-069 Profile */}
          <BatchActionRow
            title="Change ONUs TR-069 profile"
            icon={PiGear}
            color="green"
            isExpanded={expandedSections['tr069']}
            onToggle={() => toggleSection('tr069')}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  TR-069 Enabled
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={tr069Enabled}
                  onChange={(e) => setTr069Enabled(e.target.value)}
                  style={{ maxWidth: '120px' }}
                  disabled={!isOltSelected}
                >
                  <option value="">Select</option>
                  <option value="0">Disable</option>
                  <option value="1">Enable</option>
                </select>
              </div>

              {!isOltSelected && (
                <Text className="text-xs text-red-600">
                  Please select an OLT to enable this action
                </Text>
              )}

              <Button
                size="sm"
                color="primary"
                disabled={isSubmitting || !isOltSelected || !tr069Enabled}
                onClick={() => handleApplyAction('change_tr069', {
                  actions: {
                    mgmt_ip_mode: 'dhcp',
                    tr069_enabled: tr069Enabled === '1',
                  }
                })}
              >
                {isSubmitting ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </BatchActionRow>
        </div>
      </div>
    </div>
  );
}

interface BatchActionRowProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'orange' | 'green' | 'pink';
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
  },
  green: {
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
  },
  pink: {
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600',
  },
};

function BatchActionRow({
  title,
  icon: Icon,
  color,
  isExpanded,
  onToggle,
  children,
}: BatchActionRowProps) {
  const colors = colorClasses[color];

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden transition-all duration-200',
      isExpanded ? 'border-gray-300' : 'border-gray-200',
      isExpanded && 'shadow-sm'
    )}>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200',
          isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
        )}
      >
        <div className={cn(
          'rounded-md p-2 transition-colors duration-200',
          colors.iconBg
        )}>
          <Icon className={cn(
            'h-4 w-4',
            colors.iconText
          )} />
        </div>
        <Text className={cn(
          'flex-1 text-sm font-medium transition-colors duration-200',
          isExpanded ? 'text-gray-900' : 'text-gray-700'
        )}>
          {title}
        </Text>
        <PiCaretRight
          className={cn(
            'h-4 w-4 transition-all duration-200',
            isExpanded ? 'rotate-90 text-gray-700' : 'text-gray-400'
          )}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
