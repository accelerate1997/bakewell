import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  label: string;
  delta: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export function StatCard({
  value,
  label,
  delta,
  isPositive,
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <Card className="p-5 border-[#d4d9b8] rounded-[8px] shadow-none flex items-start gap-4">
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon size={24} />
      </div>
      
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">
          {label}
        </p>
        <h3 className="text-2xl font-black text-[#1a2c1a] mt-0.5">
          {value}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <ArrowUpRight size={14} className="text-[#3B6D11]" />
          ) : (
            <ArrowDownRight size={14} className="text-[#A32D2D]" />
          )}
          <span className={cn(
            "text-xs font-bold",
            isPositive ? "text-[#3B6D11]" : "text-[#A32D2D]"
          )}>
            {delta}
          </span>
          <span className="text-[10px] text-[#8a8a7a] ml-1">vs last month</span>
        </div>
      </div>
    </Card>
  );
}
