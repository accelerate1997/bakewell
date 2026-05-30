"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spend: number;
  lastOrder: string;
  segment: string;
}

interface CustomersClientViewProps {
  customers: CustomerItem[];
  stats: {
    totalCustomers: number;
    newThisMonth: number;
    repeatCustomers: number;
    avgLifetimeValue: number;
  };
}

const segmentStyles: Record<string, string> = {
  Loyal: "bg-[#EAF3DE] text-[#3B6D11]",
  Repeat: "bg-[#FAEEDA] text-[#854F0B]",
  New: "bg-[#E6F1FB] text-[#185FA5]",
};

export function CustomersClientView({ customers, stats }: CustomersClientViewProps) {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.phone.toLowerCase().includes(q)
      );
    }

    if (segment !== 'all') {
      result = result.filter(c => c.segment.toLowerCase() === segment.toLowerCase());
    }

    if (sortBy === 'orders') {
      result.sort((a, b) => b.orders - a.orders);
    } else if (sortBy === 'spend') {
      result.sort((a, b) => b.spend - a.spend);
    }

    return result;
  }, [customers, search, segment, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Customers</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage your customer relationships and segments</p>
        </div>
        <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest">
          {stats.totalCustomers} Total Customers
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'New This Month', value: stats.newThisMonth.toString(), icon: UserPlus, bg: 'bg-[#E6F1FB]', color: 'text-[#185FA5]' },
          { label: 'Repeat Customers', value: stats.repeatCustomers.toString(), icon: UserCheck, bg: 'bg-[#FAEEDA]', color: 'text-[#854F0B]' },
          { label: 'Avg Lifetime Value', value: `₹${stats.avgLifetimeValue.toLocaleString()}`, icon: TrendingUp, bg: 'bg-[#EEEDFE]', color: 'text-[#534AB7]' },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
              <h4 className="text-xl font-black text-[#1a2c1a]">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone..." 
              className="pl-10 h-10 border-[#d4d9b8] bg-white" 
            />
          </div>
          <Select value={segment} onValueChange={(val: any) => setSegment(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="loyal">Loyal (6+ orders)</SelectItem>
              <SelectItem value="repeat">Repeat (2-5 orders)</SelectItem>
              <SelectItem value="new">New (1 order)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val || 'recent')}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Joined</SelectItem>
              <SelectItem value="orders">Most Orders</SelectItem>
              <SelectItem value="spend">Highest Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold text-center">Orders</th>
                <th className="px-6 py-4 font-bold">Total Spend</th>
                <th className="px-6 py-4 font-bold">Last Order</th>
                <th className="px-6 py-4 font-bold">Segment</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2e8]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#8a8a7a] text-xs font-bold uppercase tracking-wider">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, i) => (
                  <tr key={customer.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "hover:bg-[#f0f2e8] transition-colors cursor-pointer")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3d5a2e]/10 flex items-center justify-center font-bold text-xs text-[#3d5a2e]">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#1a2c1a]">{customer.name}</p>
                          <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="rounded-full border-[#d4d9b8] text-[10px] font-bold px-2 py-0">
                        {customer.orders} orders
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-[#3B6D11]">₹{customer.spend.toLocaleString()}</td>
                    <td className="px-6 py-4 text-[10px] text-[#8a8a7a] font-bold uppercase">{customer.lastOrder}</td>
                    <td className="px-6 py-4">
                      <Badge className={cn("rounded-full border-none px-3 py-0.5 text-[9px] font-black uppercase", segmentStyles[customer.segment])}>
                        {customer.segment}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]">
                        <ChevronRight size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
