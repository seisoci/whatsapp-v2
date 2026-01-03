'use client';

import { useEffect, useState, useRef, memo, useMemo } from 'react';
import { getSystemInfo } from '@/lib/sanctum-api';
import { SystemInfo } from '@/types/system-info';
import { Progressbar, Text } from 'rizzui';
import WidgetCard from '@core/components/cards/widget-card';
import cn from '@core/utils/class-names';
import { PiCpu, PiHardDrives, PiMemory } from 'react-icons/pi';

// Animated number component for smooth transitions
const AnimatedNumber = memo(({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef<number | null>(null);

  useEffect(() => {
    // First mount - set immediately without animation
    if (displayValue === null) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    // Skip if value hasn't changed
    if (previousValueRef.current === value) {
      return;
    }

    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const startValue = previousValueRef.current ?? value;
    const endValue = value;
    previousValueRef.current = value;

    // If values are very close, just set it
    if (Math.abs(startValue - endValue) < 0.01) {
      setDisplayValue(endValue);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutCubic;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [value, displayValue]);

  // Show nothing until we have a value
  if (displayValue === null) {
    return <>0.0{suffix}</>;
  }

  return <>{displayValue.toFixed(decimals)}{suffix}</>;
});

AnimatedNumber.displayName = 'AnimatedNumber';

// Separate component for CPU card to prevent re-mount
const CpuCard = memo(({ data }: { data: SystemInfo['cpu'] }) => {
  const getColorByUsage = (usage: number) => {
    if (usage < 60) return 'success';
    if (usage < 80) return 'warning';
    return 'danger';
  };

  return (
    <WidgetCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <PiCpu className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <Text className="text-sm text-gray-600">CPU Usage</Text>
            <Text className="text-2xl font-bold">
              <AnimatedNumber value={data.usage_percent} decimals={1} suffix="%" />
            </Text>
          </div>
        </div>
      </div>
      <Progressbar
        value={data.usage_percent}
        color={getColorByUsage(data.usage_percent)}
        size="lg"
        className="mb-2 smooth-progress"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{data.cores} Cores</span>
        {data.load_average && (
          <span>Load: <AnimatedNumber value={data.load_average[0] || 0} decimals={2} /></span>
        )}
      </div>
    </WidgetCard>
  );
});

CpuCard.displayName = 'CpuCard';

// Separate component for Memory card
const MemoryCard = memo(({ data }: { data: SystemInfo['memory'] }) => {
  const getColorByUsage = (usage: number) => {
    if (usage < 60) return 'success';
    if (usage < 80) return 'warning';
    return 'danger';
  };

  return (
    <WidgetCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <PiMemory className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <Text className="text-sm text-gray-600">Memory Usage</Text>
            <Text className="text-2xl font-bold">
              <AnimatedNumber value={data.usage_percent} decimals={1} suffix="%" />
            </Text>
          </div>
        </div>
      </div>
      <Progressbar
        value={data.usage_percent}
        color={getColorByUsage(data.usage_percent)}
        size="lg"
        className="mb-2 smooth-progress"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span><AnimatedNumber value={data.used_gb} decimals={1} suffix=" GB used" /></span>
        <span><AnimatedNumber value={data.total_gb} decimals={1} suffix=" GB total" /></span>
      </div>
    </WidgetCard>
  );
});

MemoryCard.displayName = 'MemoryCard';

// Separate component for Disk card
const DiskCard = memo(({ data }: { data: SystemInfo['disk'] }) => {
  const getColorByUsage = (usage: number) => {
    if (usage < 60) return 'success';
    if (usage < 80) return 'warning';
    return 'danger';
  };

  return (
    <WidgetCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <PiHardDrives className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <Text className="text-sm text-gray-600">Disk Usage</Text>
            <Text className="text-2xl font-bold">
              <AnimatedNumber value={data.usage_percent} decimals={1} suffix="%" />
            </Text>
          </div>
        </div>
      </div>
      <Progressbar
        value={data.usage_percent}
        color={getColorByUsage(data.usage_percent)}
        size="lg"
        className="mb-2 smooth-progress"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span><AnimatedNumber value={data.used_gb} decimals={1} suffix=" GB used" /></span>
        <span><AnimatedNumber value={data.total_gb} decimals={1} suffix=" GB total" /></span>
      </div>
    </WidgetCard>
  );
});

DiskCard.displayName = 'DiskCard';

export default function SystemInfoWidget() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchSystemInfo = async () => {
    try {
      // Only show loading spinner on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      const response = await getSystemInfo();
      // Backend returns data directly without 'data' wrapper
      setSystemInfo(response);
      if (isInitialLoad) {
        setIsInitialLoad(false);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching system info:', err);
      setError(err?.message || 'Failed to load system information');
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSystemInfo();

    // Refresh every 10 seconds
    const interval = setInterval(fetchSystemInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  // Memoize data objects with stable references to prevent card re-mounting
  // IMPORTANT: Only track the properties that are actually displayed to prevent unnecessary re-renders
  const cpuData = useMemo(() => {
    if (!systemInfo?.cpu) return null;
    return {
      usage_percent: systemInfo.cpu.usage_percent,
      cores: systemInfo.cpu.cores,
      load_average: systemInfo.cpu.load_average
    };
  }, [
    systemInfo?.cpu?.usage_percent,
    systemInfo?.cpu?.cores,
    systemInfo?.cpu?.load_average?.[0],
    systemInfo?.cpu?.load_average?.[1],
    systemInfo?.cpu?.load_average?.[2]
  ]);

  const memoryData = useMemo(() => {
    if (!systemInfo?.memory) return null;
    return {
      total: systemInfo.memory.total,
      used: systemInfo.memory.used,
      free: systemInfo.memory.free,
      usage_percent: systemInfo.memory.usage_percent,
      total_gb: systemInfo.memory.total_gb,
      used_gb: systemInfo.memory.used_gb,
      free_gb: systemInfo.memory.free_gb
    };
  }, [
    systemInfo?.memory?.total,
    systemInfo?.memory?.used,
    systemInfo?.memory?.free,
    systemInfo?.memory?.usage_percent,
    systemInfo?.memory?.total_gb,
    systemInfo?.memory?.used_gb,
    systemInfo?.memory?.free_gb
  ]);

  const diskData = useMemo(() => {
    if (!systemInfo?.disk) return null;
    return {
      total: systemInfo.disk.total,
      used: systemInfo.disk.used,
      free: systemInfo.disk.free,
      usage_percent: systemInfo.disk.usage_percent,
      total_gb: systemInfo.disk.total_gb,
      used_gb: systemInfo.disk.used_gb,
      free_gb: systemInfo.disk.free_gb
    };
  }, [
    systemInfo?.disk?.total,
    systemInfo?.disk?.used,
    systemInfo?.disk?.free,
    systemInfo?.disk?.usage_percent,
    systemInfo?.disk?.total_gb,
    systemInfo?.disk?.used_gb,
    systemInfo?.disk?.free_gb
  ]);

  // Show loading skeleton only on initial load
  if (loading && isInitialLoad) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <WidgetCard className="p-6 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </WidgetCard>
        <WidgetCard className="p-6 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </WidgetCard>
        <WidgetCard className="p-6 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </WidgetCard>
      </div>
    );
  }

  // Show error state
  if (error || !systemInfo) {
    return (
      <WidgetCard className="p-6">
        <Text className="text-center text-red-500">
          {error || 'Failed to load system information'}
        </Text>
      </WidgetCard>
    );
  }

  // Always render the same container to prevent grid re-mount
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cpuData && <CpuCard key="cpu" data={cpuData} />}
      {memoryData && <MemoryCard key="memory" data={memoryData} />}
      {diskData && <DiskCard key="disk" data={diskData} />}
    </div>
  );
}
