'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { ContactGrowthItem } from '@/lib/api/analytics';

export function ContactGrowthChart({ data }: { data: ContactGrowthItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-6 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Pertumbuhan Kontak (30 Hari Terakhir)
      </h4>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                try { return format(new Date(v), 'dd/MM'); } catch { return v; }
              }}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(v) => {
                try { return format(new Date(v), 'dd MMM yyyy'); } catch { return v; }
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" iconSize={8} />
            <Bar
              yAxisId="left"
              dataKey="newContacts"
              name="Kontak Baru"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Kumulatif"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
