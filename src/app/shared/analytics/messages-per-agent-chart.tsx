'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgentMessageCount } from '@/lib/api/analytics';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1'];

export function MessagesPerAgentChart({ data }: { data: AgentMessageCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Pesan per Agen</h4>
        <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">Tidak ada data</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Pesan per Agen</h4>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="username"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} pesan (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => (
                <span className="text-xs text-gray-600">{value}: {entry.payload.count}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400">Total: {total} pesan</p>
    </div>
  );
}
