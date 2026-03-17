'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MessageStatusItem } from '@/lib/api/analytics';

const STATUS_COLORS: Record<string, string> = {
  sent: '#6366f1',
  delivered: '#3b82f6',
  read: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b',
  played: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Terkirim',
  delivered: 'Diterima',
  read: 'Dibaca',
  failed: 'Gagal',
  pending: 'Pending',
  played: 'Diputar',
};

export function MessageStatusChart({ data }: { data: MessageStatusItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-6 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Status Pesan Keluar
      </h4>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? '#9ca3af'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                value,
                STATUS_LABELS[String(name)] ?? String(name),
              ]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => STATUS_LABELS[value] ?? value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
