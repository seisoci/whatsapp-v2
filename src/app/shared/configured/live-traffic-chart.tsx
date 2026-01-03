'use client';

import { useEffect, useState, useRef } from 'react';
import { getOnuTraffic } from '@/lib/sanctum-api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader, Text } from 'rizzui';

interface LiveTrafficChartProps {
  onuId: string;
  isActive: boolean;
}

interface TrafficData {
  download: string | number;
  upload: string | number;
}

interface ChartDataPoint {
  time: string;
  download: number;
  upload: number;
}

interface TrafficStats {
  downloadSpeed: number;
  uploadSpeed: number;
  downloadPeak: number;
  uploadPeak: number;
}

const MAX_DATA_POINTS = 100; // Increased from 50 to 100 for longer history
const UPDATE_INTERVAL = 3000; // 3 seconds

// Helper function to format speed with appropriate unit
const formatSpeed = (speedMbps: number): { value: string; unit: string } => {
  // Convert Mbps to Kbps
  const kbps = speedMbps * 1024;

  // If Kbps >= 1000, convert back to Mbps
  if (kbps >= 1000) {
    return { value: speedMbps.toFixed(2), unit: 'Mbps' };
  } else {
    return { value: kbps.toFixed(2), unit: 'Kbps' };
  }
};

export default function LiveTrafficChart({ onuId, isActive }: LiveTrafficChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<TrafficStats>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    downloadPeak: 0,
    uploadPeak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iterationsRef = useRef(150);

  const getTime = () => {
    const d = new Date();
    return d.toTimeString().substr(0, 8);
  };

  const fetchTrafficData = async () => {
    try {
      const response = await getOnuTraffic(onuId);
      const rawData = response.data;

      // Backend returns Kbps values directly, convert to number
      const downloadKbps = typeof rawData.download === 'string' ? parseFloat(rawData.download) : rawData.download;
      const uploadKbps = typeof rawData.upload === 'string' ? parseFloat(rawData.upload) : rawData.upload;

      // Convert Kbps to Mbps
      const downloadSpeed = downloadKbps / 1000;
      const uploadSpeed = uploadKbps / 1000;

      // Update stats
      setStats(prev => ({
        downloadSpeed: Number(downloadSpeed.toFixed(2)),
        uploadSpeed: Number(uploadSpeed.toFixed(2)),
        downloadPeak: Math.max(prev.downloadPeak, downloadSpeed),
        uploadPeak: Math.max(prev.uploadPeak, uploadSpeed),
      }));

      // Add data point to chart
      setChartData(prev => {
        const newData = [
          ...prev,
          {
            time: getTime(),
            download: Number(downloadSpeed.toFixed(2)),
            upload: Number(uploadSpeed.toFixed(2)),
          }
        ];

        // Always maintain MAX_DATA_POINTS length
        if (newData.length > MAX_DATA_POINTS) {
          return newData.slice(newData.length - MAX_DATA_POINTS);
        }
        return newData;
      });

      if (loading) setLoading(false);
      setError(null);

    } catch (err: any) {
      setError(err?.message || 'Failed to load traffic data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      // Initialize chart with empty data points (null values) to create space on the left
      const emptyData: ChartDataPoint[] = Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
        time: '',
        download: null as any,
        upload: null as any,
      }));

      setChartData(emptyData);
      setStats({
        downloadSpeed: 0,
        uploadSpeed: 0,
        downloadPeak: 0,
        uploadPeak: 0,
      });
      iterationsRef.current = 150;
      setLoading(true);

      // First fetch
      fetchTrafficData();

      // Set up interval
      intervalRef.current = setInterval(() => {
        if (iterationsRef.current > 0) {
          fetchTrafficData();
          iterationsRef.current -= 1;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, UPDATE_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Clean up when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setChartData([]);
    }
  }, [isActive, onuId]);

  if (!isActive) {
    return null;
  }

  if (loading && chartData.length === 0) {
    return (
      <div className="mt-6 flex items-center justify-center p-10">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <Text className="text-sm text-red-600">{error}</Text>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Live Traffic Monitor
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              hide={true}
            />
            <YAxis
              label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="download"
              stroke="#4285F4"
              name="Download"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="upload"
              stroke="#F58411"
              name="Upload"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <tbody>
            {/* Upload Row */}
            <tr className="border-b border-gray-200">
              <td className="p-3 text-sm font-semibold text-gray-700" style={{ width: '25%' }}>
                <span className="flex items-center gap-2">
                  <span className="text-orange-600">↑</span> Upload Speed
                </span>
              </td>
              <td className="p-3 text-center text-sm" style={{ width: '25%' }}>
                {(() => {
                  const { value, unit } = formatSpeed(stats.uploadSpeed);
                  return `${value} ${unit}`;
                })()}
              </td>
              <td className="p-3 text-sm font-semibold text-gray-700" style={{ width: '25%' }}>Max</td>
              <td className="p-3 text-center text-sm" style={{ width: '25%' }}>
                {(() => {
                  const { value, unit } = formatSpeed(stats.uploadPeak);
                  return `${value} ${unit}`;
                })()}
              </td>
            </tr>
            {/* Download Row */}
            <tr>
              <td className="p-3 text-sm font-semibold text-gray-700" style={{ width: '25%' }}>
                <span className="flex items-center gap-2">
                  <span className="text-blue-600">↓</span> Download Speed
                </span>
              </td>
              <td className="p-3 text-center text-sm" style={{ width: '25%' }}>
                {(() => {
                  const { value, unit } = formatSpeed(stats.downloadSpeed);
                  return `${value} ${unit}`;
                })()}
              </td>
              <td className="p-3 text-sm font-semibold text-gray-700" style={{ width: '25%' }}>Max</td>
              <td className="p-3 text-center text-sm" style={{ width: '25%' }}>
                {(() => {
                  const { value, unit } = formatSpeed(stats.downloadPeak);
                  return `${value} ${unit}`;
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
