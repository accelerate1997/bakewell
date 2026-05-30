'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const data = [
  { date: '01 May', revenue: 4200 },
  { date: '03 May', revenue: 3800 },
  { date: '05 May', revenue: 5200 },
  { date: '07 May', revenue: 4800 },
  { date: '09 May', revenue: 6100 },
  { date: '11 May', revenue: 5800 },
  { date: '13 May', revenue: 7200 },
  { date: '15 May', revenue: 6800 },
  { date: '17 May', revenue: 8400 },
  { date: '19 May', revenue: 7900 },
  { date: '21 May', revenue: 9200 },
  { date: '23 May', revenue: 8800 },
  { date: '25 May', revenue: 7500 },
  { date: '27 May', revenue: 8200 },
  { date: '29 May', revenue: 9800 },
  { date: '31 May', revenue: 10400 },
];

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
  range: string;
  onRangeChange: (range: string) => void;
}

export function RevenueChart({ data, range, onRangeChange }: RevenueChartProps) {
  const getInterval = () => {
    const len = data.length;
    if (len <= 8) return 0;
    if (len <= 16) return 1;
    if (len <= 31) return 4;
    return 9;
  };

  return (
    <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-[#1a2c1a]">
            Revenue Overview
          </h3>
          <p className="text-xs text-[#8a8a7a]">Daily revenue trends for the selected period</p>
        </div>
        
        <div className="flex bg-[#f0f2e8] p-1 rounded-md">
          {['7D', '30D', '90D'].map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer",
                range === r 
                  ? "bg-white text-[#3d5a2e] shadow-sm" 
                  : "text-[#8a8a7a] hover:text-[#1a2c1a]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3d5a2e" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3d5a2e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2e8" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8a8a7a', fontSize: 10, fontWeight: 700 }}
              dy={10}
              interval={getInterval()}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8a8a7a', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #d4d9b8',
                boxShadow: 'none',
                fontSize: '12px',
                fontWeight: '700'
              }}
              formatter={(value) => [`₹${value}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3d5a2e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
