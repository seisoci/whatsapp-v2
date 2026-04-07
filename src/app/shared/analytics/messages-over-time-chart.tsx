'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MessageOverTime } from '@/lib/api/analytics';

export function MessagesOverTimeChart({ data }: { data: MessageOverTime[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-6 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Pesan Masuk & Keluar (30 Hari Terakhir)
      </h4>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const parts = String(v).split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v;
              }}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(v) => {
                const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
                const parts = String(v).split('-');
                if (parts.length === 3) {
                  return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
                }
                return v;
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" iconSize={8} />
            <Line
              type="monotone"
              dataKey="incoming"
              name="Masuk"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="outgoing"
              name="Keluar"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
